var projectStatusList = {opened:"Создан",planning:"Планирование",contractor:"Выбор предложения",bubget:"бюджетирование",control:"контроль",closed:"закрыт"};
var actStatusList = {created:"Формируется",voted:"Предложено",accepted:"Принято",deniing:"Отменяется",denied:"Отменено"};
var partStatusList = {voted:"Принимается",accepted:"Действующий",denied:"Исключен"};
var resUseList={personal:"индивидуально",common:"общий"};

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
				Prj.create(svc, form.values(), function(prj){
					svc.psid[prj.uuid] = prj.psid;
					prj.display();
				});
			} 
			//обработка закрытияформы
			,function(){
				cbCancel;
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
						Prj.collectList(
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
				svc.display();
			}
		)
	);
	
}

//Обновление списка проектов пользователя
//container - контейнер для вывода, 
//svc - данные сервиса
function refreshProjectList(list, container, svc) {
	makeRowSet(container,
		[
			{name:"name"
				,onClick:function(rowData, rowId, elt, evt){
					new Prj(svc, rowData).display();
				}
				,popupProvider:function(rowData, rowId){
					return rowData.descr;
				}
			}
			,{name:"begin_date_d", classList:["date"]}
			,{name:"initiator_d"}
			,{name:"status_d"}
		]
		,list.map(function(rowData,i){
			if (rowData.initiator) {rowData.initiator_d = "инициатор";} else {rowData.initiator_d = "";}
			rowData.begin_date_d = format(new Date(rowData.begin_date),'%d.%m.%Y');
			rowData.status_d = projectStatusList[rowData.status];
			return rowData;
		})
		,{}
	);
	return true;
}


//Рабочая область сервиса
function displayService(svc){
//обновление навигации
	displayNav(svc
		,[new ToolItem("Новый проект", newProject.curry(svc, function(){svc.display();}))]
	);
//домен сервиса
	domain = svc.domain;
//заголовок, описание сервиса
	document.title=svc.name;
	$("content-title").text(svc.name);
	$("content-description").text(svc.descr);
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
			,[
				new ToolItem("новый", newProject.curry(svc, function(){svc.display();}))
			] 
		).insertTo($("content-container")).show();
		svc.pList.once('projectList', refreshProjectList.rcurry(projList.first('.content'), svc));
	}
	//список открытых проектов
		var lcont =	makePList(
			"Список открытых проектов"
			,"open-project-list"
			,function(pn, ipp) {
				aget('/project/list'
					,{
						page_number:pn, 
						projects_per_page:ipp,
						status:"planning",
						begin_date:'2011-01-01',
						search:null
					}
					,function(r){
						makeRowSet(lcont.first('.content'),
							[{
								name:"name"
								,onClick: function(evt, elt, rowData, rowId){
									enterOpenProject(svc, rowData.uuid);
								}
 							},{name:"begin_date_d", classList:["date"]}
 							,{name:"descr"}]
							,r.projects.map(function(rowData, i){
								rowData.begin_date_d = format(new Date(rowData.begin_date),'%d.%m.%Y');
								return rowData;
							})
							,{	}
						)
//						.delegate('click','div.fieldset',function(evt,p1){
//							enterOpenProject(svc, r.projects[this.get("row_id")].uuid);
//						});
					}
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
				prj.invitePart(form.values(),function(resp){
						prj.display();
				});
			} 
			//обработка закрытияформы
			,function(){
				prj.display();
			}
		)
	);

}
//запрос на исключение участника
//prj - данные проекта, 
//uuid - ид участника
function kickoutPart(prj, fields){
	var d = new Dialog.Prompt({label:"Причина"})
		.onOk(
			function(){
				new Part(prj, fields).kickout(undefined, this.input.value());
				this.hide();
			}
		).show();
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
			Part.setData(prj, form.values(),function(resp){
				prj.display();
			});
		} 
		//обработка закрытияформы
		,function(){
			prj.display();
		}
	);
	$('content-container').clean().append(fm);
	fm = fm.first('form');
	fm.input("name").setValue(participant.name);
	fm.input("descr").setValue(participant.descr);
	fm.input("uuid").setValue(participant.uuid);
	fm.input("psid").setValue(prj.psid);
}

//Обновление списка участников
//prj - проект
function refreshPartList(list, container, prj){
	var me;

	makeRowSet(container,
		[
			{
				name:"name"
				,popupProvider:function(rowData, rowId){
					return $E("span").text(rowData.descr);
				}
			},{
				name:"status_d"
				,popupProvider:function(rowData, rowId){
					if (rowData.votes.length > 0) {
						var variants;
						if (rowData.status == "voted") {
							variants = [{
								vote: "include"
								, text: "согласны принять участника"
								,toolItem: new ToolItem("Принять", Part.include.curry(prj,rowData.uuid))
							},{
								vote:"exclude"
								,text:"против принятия"
								,toolItem: new ToolItem("Не принимать", Part.exclude.curry(prj,rowData.uuid))
							}];
						} else if (rowData.status == "accepted") {
							variants = [{
								vote:"exclude"
								, text:"согласны изгнать участника"
								,toolItem: new ToolItem("Изгнать", Part.exclude.curry(prj,rowData.uuid))
							},{
								vote:"include"
								, text:"против изгнания"
								,toolItem: new ToolItem("Не изгонять", Part.include.curry(prj,rowData.uuid))
							}];
						}
						return makeOpenVotingDialog(variants, rowData.votes, prj.partList.data);
					} else if (rowData.status == "accepted") {
						return makeDialog(rowData.name
							,[rowData.descr]
							,[	new ToolItem("Исключить", Part.exclude.curry(prj,rowData.uuid)) ]
						);
					} else {
					}					
				} 
			},{
				name:"descr",
				popupProvider:function(rowData,i){return rowData.descr;}	
			}
		]
		,list.filter(function(rowData,i){
			if (rowData.me) {
				me = rowData;  //созранение записи о текущем участнике
				return false; //не включая в список 
			} else {
				return rowData.status != "denied";  //фильтруем исключенных 
			}
		}).map(function(rowData, i){
			//rowData.status_d = partStatusList[rowData.status]; 
			
			if (((rowData.status == "accepted") && (rowData.votes.length > 0)) || (rowData.status == "voted")) {
				rowData.status_d = "???";
			} else {
				rowData.status_d = "***";
			}
			
			return rowData;
		})
		,{
			rowClassProvider: function(rowData) {
				var result = ["part-list-row"];
				if (rowData.status == "voted") {result.push("voted");}
				return result.join(" ");
			}
		}
	);
	if (!container.delegates('click', 'div.fieldset')) {
		container.delegate('click','div.fieldset',function(evt,p1){
//			new Prj(svc, list[this.get("row_id")]).display();
		});
	}
	$("participant-me").first(".panel").clean();
	$("participant-me").first(".name").text(me.name);
	$("participant-me").first(".panel").insert(
		ToolItem.composeList(
			[new ToolItem("Изм.", setPartData.curry(prj, me))]
		)
	);	
}

//*****************************************
//            Параметры

//обновление списка параметров
//container - контейнер элементов,
//prj - данные проекта
function refreshParamList(list, container, prj) {
	makeRowSet(container,
		[{name:"name"},{name:"value"}]
		,list
		,{}
	);
	if (!container.delegates('click', 'div.fieldset')) {
		container.delegate('click','div.fieldset',function(evt,p1){
//			new Prj(svc, list[this.get("row_id")]).display();
		});
	}

}	


//*****************************************
//            Мероприятия

//обновление списка мероприятий
//container - контейнер элементов,
//prj - данные проекта
function refreshActList(list, container, prj) {
	//запрос
	//обработка списка
	var actList = list.filter(function(item,i){return item.status != "denied"});
	makeRowSet(container,
		//Каталог полей
		[
			{name:"part"
				,classList:["button"]
				,popupProvider:function(rowData, rowId) {
					var texts = [rowData.descr,"Время:" ,"Участники:", "Используются:"];
					var toolItems = [];
					if (!rowData.participant) {
						toolItems.push(new ToolItem("Участвовать.", Act.participate.curry(prj, "include", rowData.uuid)));
						texts.push("-------------");	
						texts.push("Вы еще не являетесь участником");	
					} else {
						toolItems.push(new ToolItem("Не участвовать.", Act.participate.curry(prj, "exclude", rowData.uuid)));
						texts.push("-------------");	
						texts.push("Вы уже являетесь участником");	
					}
					return makeDialog(rowData.name, texts, toolItems);
				}
			}
			,{name:"name"
				,popupProvider:function(rowData, rowId){
					return rowData.descr;
				}
				,onClick:function(rowData, rowId, elt, evt){ 
						new Act(prj, rowData).display();
				}
			}
			,{name:"period"}
			//статус
			,{name:"status_d"
				//провайдер формы деталей по статусу
				,popupProvider:function(rowData, rowId){
					if (rowData.votes.length > 0) {
						var variants;
						if (rowData.status == "voted") {
							variants = [{
								vote: "include"
								, text: "согласны включить мероприятие"
								,toolItem: new ToolItem("Включить", Act.accept.curry(prj, rowData.uuid))
							},{
								vote:"exclude"
								,text:"против мероприятия"
								,toolItem: new ToolItem("Не включить", Act.deny.curry(prj, rowData.uuid))
							}];
						} else if (rowData.status == "accepted") {
							variants = [{
								vote:"exclude"
								, text:"согласны отменить мероприятие"
								,toolItem: new ToolItem("Отменить", Act.deny.curry(prj, rowData.uuid))
							},{
								vote:"include"
								, text:"против отмены"
								,toolItem: new ToolItem("Не отменять", Act.accept.curry(prj, rowData.uuid))
							}];
						}
						return makeOpenVotingDialog(variants, rowData.votes, prj.partList.data);
					} else if (rowData.status == "created") {
						return makeDialog("Новое мероприятие"
							,["Вы хотите предложить новое мероприятие. Определите параметры и сформируйте набор ресурсов, необходимых для его проведения и затем, нажмите опубликовать, чтобы другие участники его увидели, либо удалить, если передумаете."]
							,[
								new ToolItem("Опубликовать", Act.public.curry(prj, rowData.uuid))
								,new ToolItem("Удалить", Act.delete.curry(prj, rowData.uuid))
							]
						);
					} else if (rowData.status == "accepted") {
						return makeDialog(rowData.name
							,[rowData.descr]
							,[	new ToolItem("Отменить", Act.deny.curry(prj, rowData.uuid)) ]
						);
					} else {
					}					
				} 
			},{
				name:"descr"
				,popupProvider: function(rowData,i){return rowData.descr;}
			}]
		//список мероприятий
		,actList.map(function(act,i){
			act.period = format(new Date(act.begin), "%d.%m %H:%M") + " - " + format(new Date(act.begin), "%d.%m %H:%M");
//			act.status_d = actStatusList[act.status];
			if ((act.status == "accepted") && (act.votes.length > 0) || (act.status == "voted")) {act.status_d = "????"; }
			else if (act.status == "created") {act.status_d = "Невиден";}
			else {act.status_d = "****";}
			if (act.participant) {act.part = "Участвую";} else {act.part = "Не участвую";}
			return act;
		})
		//опции
		,{
			rowClassProvider: function(rowData) {
				var result = ["act-list-row", rowData.status];
				return result.join(" ");
			}
		}
	)
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
				Act.create(prj, form.values(), function(act){
					act.display();
				});
			} 
			//обработка закрытияформы
			,function(){
				cbCancel();
			}
		)
	);
} 

//*****************************************
//Ресурсы

//Новый ресурс
function newResource(prj, cbOk, cbCancel){
//заголовок
	$("content-title").text('Новый ресурс');
	$("content-description").text('заполните поля, бла бла бла');

//форм формы
	$('content-container').clean().append(
		makeForm(
			$('new-resource-template')  //шаблон формы
			,"new-resource"
			,"параметры созания ресурса" //заголовок формы
			//обработка сабмита
			,function(evt, form){
				Res.create(prj, form.values(), function(res){
					cbOk();
				});
			} 
			//обработка закрытияформы
			,function(){
				cbCancel();
			}
		)
	);
}
//обновление списка ресурсов
//container - контейнер элементов,
//prj - данные проекта
function refreshResList(list, container, prj) {
	//запрос
	//обработка списка
	makeRowSet(container,
		[{
			name:"name"
		},{
			name:"amount"
		},{
			name:"units"
		}]
		,list
		,{}
	)
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


function displayProject(prj){
//обновление навигации
	displayNav(prj
		,[new ToolItem("Новое мероприятие", newActivity.curry(prj, function(){prj.display();}))]
	);

	//заголовок, описание проекта
	document.title=prj.name;
	$("content-title").text(prj.name+"     ("+prj.token+")");
	$("content-description").text(prj.descr);

	$("content-container").clean();
	$('left-footer').clean();	
	
	//статус
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
			,selected: Object.keys(projectStatusList).indexOf(prj.status)
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
//	refreshPartList(prj);
	prj.partList.once('refreshPartList', refreshPartList.rcurry($('left-container'), prj));

	//формируем действия
	$E('div').setStyle({width:"100%"}).insertTo($('left-footer')).insert(
		ToolItem.composeList(
			[new ToolItem("Пригл.", invitePart.curry(prj))]
		)
	);

//параметры
	//список параметров
	var parList = makeList(
		"Параметры"
		,"proj-param-list"
		,[] //[new ToolItem("Oбнов.", function(){refreshParamList(parList.first('.content'),prj)})]
	).insertTo($("content-container")).show();
	prj.prmList.once('refreshParamList', refreshParamList.rcurry(parList.first('.content'),prj));
//мероприятия
	var actList = makeList(
		"Мероприятия"
		,"proj-act-list"
		,[new ToolItem("Нов.", newActivity.curry(prj, function(){prj.display();}))
		]
	).insertTo($("content-container")).show();
	prj.actList.once('refreshActList', refreshActList.rcurry(actList.first('.content'),prj));

//ресурсы
	var resList = makeList(
		"Ресурсы"
		,"proj-res-list"
		,[new ToolItem("Нов.", newResource.curry(prj, function(){prj.display();}, function(){prj.display();}))
		]
	).insertTo($("content-container")).show();
	prj.resList.once('refreshResList', refreshResList.rcurry(resList.first('.content'),prj));

}

function closeProject(evt, prj) {

}




/******************************************
						Мероприятие
******************************************/

//****************************************
//                Участники

//Обновление списка участников
//act - проект
function refreshActPartList(list, container, act){
	makeRowSet(container,
		[{name:"name"}]
		,act.parent.partList.data.filter(function(rowData,i){
			return list.includes(rowData.uuid);
		})
		,{}
	);
}


//*****************************************
//                Ресурсы

//Включение ресурса
function includeResource(res, act, cbCancel){
//заголовок
//	$("content-title").text('Включение ресурса в мероприятие');
//	$("content-description").text('заполните поля, бла бла бла');

//форм формы
	$('content-container').clean().append(
		makeForm(
			$('include-resource-template')  //шаблон формы
			,"include-resource"
			,"параметры включения ресурса" //заголовок формы
			//обработка сабмита
			,function(evt, form){
				res.includeTo(act, form.values(), function(resp){
					act.display();
				});
			} 
			//обработка закрытияформы
			,function(){
				cbCancel();
			}
		)
	);
}

//обновление списка ресурсов пректа для мероприятия
//container - контейнер элементов,
//prj - данные проекта
function refreshPrjResList(list, container, act) {
	//запрос
	//обработка списка
	makeRowSet(container,
		[{name:"name"},{name:"use"}]
		,act.parent.resList.data.filter(function(item,i){
			return !(list.map(function(item,i){return item.uuid;}).includes(item.uuid))
		})
		,{
			toolItemsProvider:function(rowData){
				var toolItems = [];
				toolItems.push(new ToolItem("Включить", function(){
					includeResource(new Res(act.parent, rowData), act, function(){act.display()})
				}));
				return toolItems;
			}
		}
	)
}	

//обновление списка ресурсов мероприятия
//container - контейнер элементов,
//prj - данные проекта
function refreshActResList(list, container, act) {
	//запрос
	//обработка списка
	makeRowSet(container,
		[{
			name:"name"
		},{
			name:"amount_d"
		},{
			name:"use_d"
		},{
			name:"status_d"
			,popupProvider: function(rowData, rowId) {
					if (rowData.votes.length > 0) {
						var variants;
						if (rowData.status == "voted") {
							variants = [{
								vote: "include"
								, text: "согласны включить ресурс"
								,toolItem: new ToolItem("Включить", Res.includeTo.curry(
									act,{	psid:act.parent.psid, uuid:rowData.uuid, activity:act.uuid}
//											,need:rowData.need, amount:rowData.amount}
								))
							},{
								vote:"exclude"
								,text:"против использования"
								,toolItem: new ToolItem("Не включить", Res.exclude.curry(act, rowData.uuid))
							}];
						} else if (rowData.status == "accepted") {
							variants = [{
								vote:"exclude"
								, text:"согласны отказаться от "+rowData.name
								,toolItem: new ToolItem("Отказаться", Res.exclude.curry(act, rowData.uuid))
							},{
								vote:"include"
								, text:"не желают отказываться от "+rowData.name
								,toolItem: new ToolItem("Включить", Res.includeTo.curry(
									act,{	psid:act.parent.psid, uuid:rowData.uuid, activity:act.uuid}
//											,need:rowData.need, amount:rowData.amount}
								))
							}];
						}
						return makeOpenVotingDialog(variants, rowData.votes, act.parent.partList.data);
					} else if (rowData.status == "accepted") {
						return makeDialog(rowData.name
							,[rowData.descr]
							,[	new ToolItem("Убрать", Res.exclude.curry(act, rowData.uuid)) ]
						);
					} else {
					}					
			}
		},{
			name:"descr"
		}]
		,list.map(function(rowData, i){
			rowData.use_d = resUseList[rowData.use];
			rowData.amount_d = rowData.amount+" "+rowData.units;
			if ((rowData.status == "accepted") && (rowData.votes.length > 0) || (rowData.status == "voted")) {rowData.status_d = "????"; }
			else {rowData.status_d = "****";}
			return rowData;
		})
		,{
			rowClassProvider: function(rowData) {
				var result = ["res-list-row", rowData.status];
				return result.join(" ");
			}
/*			toolItemsProvider: function(rowData){
				var toolItems = [];
				switch (rowData.status){
					case "voted":
						toolItems.push(new ToolItem("Включить", Res.include.curry(act, rowData.uuid)));
						toolItems.push(new ToolItem("Исключить", Res.exclude.curry(act, rowData.uuid)));
						break;
					case "accepted":
						toolItems.push(new ToolItem("Убрать", Res.exclude.curry(act, rowData.uuid)));
				}
				return toolItems;
			}
*/			
		}
	)
}	


function displayActivity(act) {
//обновление 
	var toolItems = [];
	if (act.status == "accepted") {toolItems.push(new ToolItem("Новый ресурс", newResource.curry(act, function(){act.display();}, function(){act.display();})))} 
	if (!act.participant) {
		toolItems.push(new ToolItem("Участвовать", function() {act.participate(
			function(resp, isOk, r){ if (isOk) {act.participant = true; act.display();} }
		)}));
	}else{
		toolItems.push(new ToolItem("Не участвовать", function() {act.unParticipate(
			function(resp, isOk, r){ if (isOk) {act.participant = false; act.display();} }
		)}));
	} 

	displayNav(act, toolItems);

	//заголовок, описание проекта
	document.title=act.name;
	$("content-title").text(act.name);
	$("content-description").text(act.descr);

	$("content-container").clean();
//	$('left-footer').clean();	
	
//параметры
	//список параметров
	var prmList = makeList(
		"Параметры"
		,"proj-param-list"
		,[]//[new ToolItem("Oбнов.", function(){refreshParamList(parList.first('.content'),prj)})]
	).insertTo($("content-container")).show();
	act.prmList.once('refreshParamList', refreshParamList.rcurry(prmList.first('.content'),act));

//участники
	//формируем список
	var partList = makeList(
		"Участники"
		,"act-part-list"
		,[]
	).insertTo($("content-container")).show();
	act.partList.once('refreshActPartList', refreshActPartList.rcurry(partList.first(".content"), act));

// Ресурсы мероприятия
	var actResList = makeList(
		"Используемые ресурсы"
		,"act-res-list"
		,[]
	).insertTo($("content-container")).show();
	act.resList.once('refreshActResList', refreshActResList.rcurry(actResList.first('.content'),act));

// Ресурсы проекта
	var prjResList = makeList(
		"Доступные на проекте ресурсы"
		,"prj-res-list"
		,[new ToolItem("Нов.", newResource.curry(act.parent, function(){act.display();}, function(){act.display();}))]
	).insertTo($("content-container")).show();
	act.resList.once('refreshPrjResList', refreshPrjResList.rcurry(prjResList.first('.content'),act));
	
	

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
		uuid:"gamma",name:"Собутыльники",descr:"Пьянки, гулянки",domain:"http:172.16.5.83:8080"
		, psid:{}
		, tokens:[]
	}
).display();


}

$(document).on('ready', begin);
