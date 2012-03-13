
//Новый проект
//svc - данные сервиса
function newProject(svc, cbCancel){
//заголовок
	$("content-title").text('Новый проект');
	$("content-description").text('заполните поля, бла бла бла');

//форм формы
	$('content-container').clean().append(
		makeForm(
			$('new-project-template')  //шаблон формы
			,"new-project"
			,"параметры созания проекта" //заголовок формы
			//обработка сабмита
			,function(evt, form){
				form.set('action',domain+"/project/create")
				if (defined(svc.userId)) {
					form.input("user_id").setValue(svc.userId);
				}
				//отправка запроса на создание
				form.send({
//					async:false,
					onSuccess:function(r){
						svc.psid[r.responseJSON.uuid] = r.responseJSON.psid;
						
						collectProjectList(
							[r.responseJSON.token]
							,[]
							,function(list){
								list[0].token = r.responseJSON.token;
								new Prj(svc, list[0]).display();
							}							
						);
					}
					,onFailure:function(r){
						alert(r.responseText) 
					}
				});
			} 
			//обработка закрытияформы
			,function(){
				displayService(svc);
			}
		)
	);
} 

//Вход на открытый проект
//svc - данные сервиса,
//idProject - ид проекта
function enterOpenProject(svc, idProject){
	$("content-title").text('Регистрация на открытом проекте');
	$("content-description").text('заполните поля, бла бла бла');

	//форм формы
	$('content-container').clean().append(
		makeForm(
			$('enter-project-template')  //шаблон формы
			,"enter-project"
			,"параметры регистрации на проекте" //заголовок формы
			//обработка сабмита
			,function(evt, form){
				form.set('action',domain+"/project/enter/open");
				if (defined(svc.userId)) {
					form.input("user_id").setValue(svc.userId);
				}
				form.input("uuid").setValue(idProject);
				//отправка запроса на создание
				form.send({
//					async:false,
					onSuccess:function(r){
						svc.setPsid(r.responseJSON.uuid, r.responseJSON.psid);
						svc.addToken(r.responseJSON.token);
						collectProjectList(
							[r.responseJSON.token]
							,[]
							,function(list){
								list[0].token = r.responseJSON.token;
								list[0].psid = r.responseJSON.psid;
								new Prj(svc, list[0]).display();
							}							
						);
					}
					,onFailure:function(r){
						alert(r.responseText) 
					}
				});
			} 
			//обработка закрытияформы
			,function(){
				displayService(svc);
			}
		)
	);
	
}

//Обновление списка проектов пользователя
//container - контейнер для вывода, 
//svc - данные сервиса
function refreshProjectList(container, svc, id) {
	Prj.collectList([svc.userId], []
		,function(list){
			fillList(
				container //контейнер
				,list     //массив
				//функция формирования элементов отображения данных проекта
				,function(item,i){
					//формирование строки списка
					var rowClass = "row"; var role = "участник";
					if (item.data.initiator) {
						rowClass += " initiator";
						role += " инициатор";
					}

					return $E('div',{class:rowClass})
						.append($E('span',{class:"cell name"}).text(item.data.name))
						.append($E('span',{class:"cell descr"}).text(item.data.descr))
						.append($E('span',{class:"cell role"}).text(role))
						.append($E('span',{class:"cell status"}).text(item.data.status))
						.onClick(
							function(evt){
								//обработка клика на записи проета
								new Prj(svc, list[i]).display();
							}
						);
				}
			)

		} 
	)
}


//Рабочая область сервиса
function displayService(svc){
//обновление навигации
	displayNav(svc
		,[new ToolItem("Новый проект", newProject.curry(svc, displayService.curry(svc)))]
	);
//домен сервиса
	domain = svc.data.domain;
//заголовок, описание сервиса
	document.title=svc.data.name;
	$("content-title").text(svc.data.name);
	$("content-description").text(svc.data.descr);
//пользователь:
	$("left-container").clean();	


	
//контент:
	$("content-container").clean();	

	//приглашение
		//готовим форму
		var tokenFm	= makeForm(
			$('project-by-token-template')  //шаблон формы
			,"project-by-token"
			,"Пригашение на проект" //заголовок формы
			//обработка отправки формы
			,function (evt,form) {
				var token = form.input("token").getValue();
				//список (из 1 проекта по токену)
				aget('/project/list/userid', {user_id:token}
					,function(list){
						list = list.map(function(item, i){return {id:item.uuid,data:item}})
						list[0].token = token;
						//вход на проект проект
						new Prj(svc, list[0]).display();
					}
				)

			}
			//обработка закрытия формы
			,function(){
				tokenFm.clean().remove();
			}
		);
		$('content-container').append(tokenFm);
	
	if (!defined(svc.userId)){
	//форма регистрации
		$('user-data').hide();
		$('user-login').show();
		var loginFm	= $('user-login').first('form');
		loginFm.onSubmit(
			function(evt){
				evt.stop();

				//регистрация пользователя
				svc.setUserId(loginFm.input("user_id").getValue());

				$('user-login').hide();
				$('user-data-name').text(svc.userId);
				$('user-data-descr').text('some description');
				$('user-data').show();
				
				svc.display();
			}
		)
	} else {
	//список проектов
		var projList = makeList(
			"Мои проекты"
			,"my-project-list"
			,[new ToolItem("новый", newProject.curry(svc, displayService.curry(svc)))
			,new ToolItem("Обнов.", function(){refreshProjectList(projList.first('.content'),svc)})] 
		).show();
		refreshProjectList(projList.first('.content'),svc);
		$("content-container").append(projList);
	}
	//список открытых проектов
		var lcont =	makePList(
			"Список открытых проектов"
			,"open-project-list"
			,function(pn, ipp) {
				new Xhr(
					domain+'/project/list'
					,{
						onSuccess: function(r){
								fillList(lcont.first('.content'), r.responseJSON.projects,
									function(item, i) {
										return $E('div',{class:"row"})
											.append($E('span',{class:"cell name"}).text(item.name))
											.append($E('span',{class:"cell descr"}).text(item.descr))
											.onClick(
												function(evt){
													enterOpenProject(svc, item.uuid);
												}
											);
									}
								);
								return r.responseJSON.pages;								
							}
						,onFailure: function(r){
								alert(r.responseText);
							}
					}).send({page_number:pn, 
								projects_per_page:ipp,
								status:"planning",
								begin_date:'2011-01-01',
								esearch:null}
					);
			}
			,function(){
				lcont.clean().remove();
			}
		).show();
	lcont.first('.refresh').fire('click');
	$("content-container").append(lcont);
}
/******************************************
						Проект
******************************************/
//****************************************
//                Участники

//пригашение участника
//prj - данные проекта
function invitePart(prj){
	$("content-title").text('Новый Участник');
	$("content-description").text('заполните поля, бла бла бла');

	//форм формы
	$('content-container').clean().append(
		makeForm(
			$('invite-participant-template')  //шаблон формы
			,"invite-participant"
			,"данные участника" //заголовок формы
			//обработка сабмита
			,function(evt, form){
				form.set('action',domain+"/participant/invite")
				form.input("psid").setValue(prj.psid);
				//отправка запроса на создание
				form.send({
//					async:false,
					onSuccess:function(r){
						new Dialog().html(r.responseJSON.token).show();
						displayProject(prj);
					}
					,onFailure:function(r){
						alert(r.responseText) 
					}
				});
			} 
			//обработка закрытияформы
			,function(){
				displayProject(prj);
			}
		)
	);

}
//запрос на исключение участника
//prj - данные проекта, 
//uuid - ид участника
function kickoutPart(prj, uuid){
	var d = new Dialog.Prompt({label:"Причина"})
		.onOk(
			function(){
				apost('/participant/exclude', {psid:prj.psid, uuid:uuid, comment:this.input.value()}
						,function(r){
								refreshPartList(prj)
								d.hide();
						}
				);
			}
		).show();
}
//запрос на согласие на предложение по участнику
//prj - данные проекта, 
//uuid - код участника
function conformPart(prj, uuid, vote){
	apost('/participant/vote/conform', {psid:prj.psid,uuid:uuid,vote:vote}
			,function(r){
					refreshPartList(prj);
			}
	);
}

function setPartData(prj, participant){
	$("content-title").text('Регистрация на открытом проекте');
	$("content-description").text('заполните поля, бла бла бла');

	//форм формы
	var fm = makeForm(
		$('edit-participant-template')  //шаблон формы
		,"edit-participant"
		,"данные участника" //заголовок формы
		//обработка сабмита
		,function(evt, form){
			form.set('action',domain+"/participant/change");
			if (defined(prj.parent.userId)) {
				form.input("user_id").setValue(prj.parent.userId);
			}
			form.input("uuid").setValue(participant.id);
			form.input("psid").setValue(prj.psid);
			//отправка запроса на создание
			form.send({
//				async:false,
				onSuccess:function(r){
					displayProject(prj);
//					refreshPartList(prj);
				}
				,onFailure:function(r){
					alert(r.responseText) 
				}
			});
		} 
		//обработка закрытияформы
		,function(){
			displayProject(prj);
		}
	);
	$('content-container').clean().append(fm);
	fm = fm.first('form');
	fm.input("name").setValue(participant.data.name);
	fm.input("descr").setValue(participant.data.descr);
}

function refreshPartList(prj){
	aget('/participant/list'
		,{psid:prj.psid}
		,function(list){
			//обработка списка
			fillList(
				$('left-container')
				,list.map(function(item, i){ return {id:item.uuid,data:item};})
				,function(item,i){
					if (item.data.status == "denied") {return;}
					if (item.data.me) {
							$("participant-me").first(".panel").clean();
							$("participant-me").first(".name").text(item.data.name);
							$("participant-me").first(".panel").insert(
								ToolItem.composeList(
									[new ToolItem("Изм.", setPartData.curry(prj, item))]
								)
							);	
//							if (defined(prj.parent.userId)){
//								apost("/participant/change"
//									,{psid:prj.psid, uuid:item.id, user_id:prj.parent.userId}
//									,function(r){alert("userId has been set")}
//								);
//							}
													
							return;
					}
					//формирование строк списка
					var e = $('participant-template').clone().set("id","part"+item.id).show();
					e.first(".title").text(item.data.name).set("title",item.data.descr);
					var toolItems=[];
					if (item.data.status == "accepted") {
						toolItems.push(new ToolItem("Искл.", kickoutPart.curry(prj,item.id)));
					}
					if (item.data.status == "voted") {
						toolItems.push(new ToolItem("Согл.", conformPart.curry(prj,item.id,"include")));
					}
					e.first('.tool-panel').insert(
						ToolItem.composeList(toolItems)
					);
					return e;	
				}
			)
		}
	)
}

//*****************************************
//            Параметры

//обновление списка параметров
//container - контейнер элементов,
//prj - данные проекта
function refreshParamList(container, prj) {
	//запрос
	aget('/project/parameter/list'
		  ,{psid:prj.psid}
			,function(list){
				//обработка списка
				fillList(
					container
					,list
					,function(item,i){
						//формирование строк списка
						//формирование строк списка
						if (!item.tecnical) {
							return $E('div',{class:"row"})
								.append($E('span',{class:"cell name", title:item.descr}).text(item.name))
								.append($E('span',{class:"cell value"}).text(item.value))
								.onClick(
									function(evt){
										//обработка клика на записи проета
										alert('param clicked');
									}
								);
							
						}
					}
				)
			}
	);
}	


//*****************************************
//            Мероприятия

//обновление списка мероприятий
//container - контейнер элементов,
//prj - данные проекта
function refreshActList(container, prj) {
	//запрос
	aget('/activity/list'
		  ,{psid:prj.psid}
		  ,function(list){
				//обработка списка
				list = list.map(function(item,i){return {id:item.uuid, data:item};});
				fillList(
					container
					,list
					,function(item,i){
						//формирование строки списка
						var toolItems = []; var rA = refreshActList.curry(container, prj);
						switch (item.data.status){
							case "created":
								toolItems.push(new ToolItem("Пуб.", Act.accept.curry(prj, item.id, rA)));
								toolItems.push(new ToolItem("Удал.", Act.delete.curry(prj, item.id, rA)));
								break;
							case "voted":
								toolItems.push(new ToolItem("Согл.", Act.accept.curry(prj, item.id, rA)));
								toolItems.push(new ToolItem("Отказ.", Act.delete.curry(prj, item.id, rA)));
								break;
							case "accepted":
								toolItems.push(new ToolItem("Убрать.", Act.deny.curry(prj, item.id, rA)));
							
						}
						return makeRow(
							[{nm:"name"},{nm:"begin"},{nm:"end"}]
							,"descr"
							,item.data
							,i
							,[]
							,toolItems
						);
					}
				);
				container.delegate('click','div.fieldSet', function(evt,item){
					new Act(prj, list[this.get('row_id')]).display();
				});
			}
	);
}	
//Новое мероприятие
//prj - данные проекта
function newActivity(prj, cbCancel){
//заголовок
	$("content-title").text('Новое мероприятие');
	$("content-description").text('заполните поля, бла бла бла');

//форм формы
	$('content-container').clean().append(
		makeForm(
			$('new-activity-template')  //шаблон формы
			,"new-activity"
			,"параметры созания мероприятия" //заголовок формы
			//обработка сабмита
			,function(evt, form){
				form.set('action',domain+"/activity/create")
				form.input("psid").setValue(prj.psid);
				//отправка запроса на создание
				form.send({
//					async:false,
					onSuccess:function(r){
//ToDo: Сервисы создания должны взвращать созданные данные с той же структурой, с какой 
//      они возвращаются в списках...
						aget('/activity/list'
		  					,{psid:prj.psid}
							,function(list){
								var fields;
								list.each(function(item,i){
										if (item.uuid == r.responseJSON.uuid) {fields = item}
									});
								new Act(prj,{id:r.uuid,data:fields}).display();
							}
						)
					}
					,onFailure:function(r){
						alert(r.responseText) 
					}
				});
			} 
			//обработка закрытияформы
			,function(){
				displayProject(prj, prj.i);
			}
		)
	);
} 




//Вход на проект по ид польз
function enterProject(prj, i){
	if (defined(crnt(prj.parent).psid[prj.list[i].id])) {
		prj.list[i].psid = crnt(prj.parent).psid[prj.list[i].id];
		displayProject(prj, i)
	} else {
		if (defined(prj.list[i].token)) {
			apost('/project/enter/invitation', {uuid:prj.list[i].id,token:prj.list[i].token}
				,function(r){
					crnt(prj.parent).tokens.push(prj.list[i].token);
					prj.list[i].psid = crnt(prj.parent).psid[prj.list[i].id] = r.psid;
					//регистрация успешна, показ проекта
					displayProject(prj, i);
				}
			);
		} else if (defined(crnt(prj.parent).userId)) {
			//запрос регистрации
			apost('/project/enter/invitation', {uuid:prj.list[i].id,token:crnt(prj.parent).userId}
				,function(r){
					prj.list[i].psid = crnt(prj.parent).psid[prj.list[i].id] = r.psid;
					//регистрация успешна, показ проекта
					displayProject(prj, i)
				}
			);
		} else {
			alert("Нет ни токена ни пользователя"); return;
		}
	}
}





function displayProject(prj){
//обновление навигации
	displayNav(prj
		,[new ToolItem("Новое мероприятие", newActivity.curry(prj, displayProject.curry(prj)))]
	);

	//заголовок, описание проекта
	document.title=prj.data.name;
	$("content-title").text(prj.data.name+"     ("+prj.token+")");
	$("content-description").text(prj.data.descr);

	$("content-container").clean();
	$('left-footer').clean();	
	
	//статус
	var projectStatusList = {opened:"Создан",planning:"Планирование",contractor:"Выбор предложения",bubget:"бюджетирование",control:"контроль",closed:"закрыт"};
	var projAdm = $("project-adm-template")
		.clone()
		.set("id","project-adm")
		.insertTo($("content-container"))
		.show();
	var sel = new Selectable(
		'project-status-select'
		,{
			options: projectStatusList
			,multiple: false
			,selected: Object.keys(projectStatusList).indexOf(prj.data.status)
		}
	).insertTo(projAdm.first('.adm-status'));
	if (!sel.getValue()){
		sel.select(sel.first('li'));
	}
	sel.on('change',function(evt){
			if (evt.target.value != prj.status) {setProjectStatus(prj, evt.target.value);}
		}
	)

//участники
	//формируем список
	refreshPartList(prj);
	//формируем действия
	$E('div').setStyle({width:"100%"}).insertTo($('left-footer')).insert(
		ToolItem.composeList(
			[new ToolItem("Пригл.", invitePart.curry(prj))
			,new ToolItem("Обн.", refreshPartList.curry(prj))]
		)
	);

//параметры
	//список параметров
	var parList = makeList(
		"Параметры"
		,"proj-param-list"
		,[new ToolItem("Oбнов.", function(){refreshParamList(parList.first('.content'),prj)})]
	).show();
	refreshParamList(parList.first('.content'),prj);
	$("content-container").append(parList);
//мероприятия
	var actList = makeList(
		"Мероприятия"
		,"proj-act-list"
		,[new ToolItem("Нов.", newActivity.curry(prj, displayProject.curry(prj)))
			,new ToolItem("Oбнов.", function(){refreshActList(actList.first('.content'),prj)})]
	).show();
	refreshActList(actList.first('.content'),prj);
	$("content-container").append(actList);
}

function closeProject(evt, prj) {

}

//Смена статуса проекта
//prj - данные проекта, 
//status - значение нового статуса
function setProjectStatus(prj, status) {
	apost('/project/status/change'
			,{psid:prj.psid,status:status}
			,function(r){
					prj.status = status;
			}
	);
}


function newResource(act, cbCancel){
	alert("new resource");	
}


function displayActivity(act) {
//обновление навигации
	displayNav(act
		,[new ToolItem("Новый ресурс", newResource.curry(act, displayActivity.curry(act)))]
	);

	//заголовок, описание проекта
	document.title=act.data.name;
	$("content-title").text(act.data.name);
	$("content-description").text(act.data.descr);

	$("content-container").clean();
	$('left-footer').clean();	
	



	alert("activity");
}

function begin(){
/*************************	
||  init layout resizing
*************************/
$('left-block').makeResizable({
	direction: "right"
	,minWidth: "189px"
	,onResize: resize
});
$('left-block').first('.rui-resizable-handle')._.style.width="4px";
$('left-block').first('.rui-resizable-content')._.style.height="96%";


new Svc(
	{
		id:"gamma"
		,data:{uuid:"gamma",name:"Собутыльники",descr:"Пьянки, гулянки",domain:"http:172.16.5.83:8080"}
		, psid:{}
		, tokens:[]
	}
).display();


}

$(document).on('ready', begin);
