
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
				if (defined(crnt(svc).userId)) {
					form.input("user_id").setValue(crnt(svc).userId);
				}
				//отправка запроса на создание
				form.send({
//					async:false,
					onSuccess:function(r){
						crnt(svc).psid[r.responseJSON.uuid] = r.responseJSON.psid;
						
						collectProjectList(
							[r.responseJSON.token]
							,[]
							,function(list){
								list[0].token = r.responseJSON.token;
								enterProject({parent: svc, list:list, i:0}, 0);
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
				if (defined(crnt(svc).userId)) {
					form.input("user_id").setValue(crnt(svc).userId);
				}
				form.input("uuid").setValue(idProject);
				//отправка запроса на создание
				form.send({
//					async:false,
					onSuccess:function(r){

						crnt(svc).psid[r.responseJSON.uuid] = r.responseJSON.psid;
						crnt(svc).tokens.push(r.responseJSON.token);
												
						collectProjectList(
							[r.responseJSON.token]
							,[]
							,function(list){
								list[0].token = r.responseJSON.token;
								list[0].psid = r.responseJSON.psid;
								displayProject({parent: svc, list:list, i:0}, 0);
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

//Рабочая область сервиса
function displayService(svc, i){
	svc.i = i;
	
//обновление навигации
	svc.cbDisplay = displayService;
	svc.cbClose = function(){alert("close?");}
	displayNav(
		svc
		,[
			{
				name:"Новый проект"
				,callback:newProject.curry(svc
													,displayService.curry(svc,i))
			}
		]
	);
//домен сервиса
	domain = svc.list[i].data.domain;
//заголовок, описание сервиса
	document.title=svc.list[i].data.name;
	$("content-title").text(svc.list[i].data.name);
	$("content-description").text(svc.list[i].data.descr);
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
						enterProject({parent: svc, list: list, i:0}, 0);
					}
				)

			}
			//обработка закрытия формы
			,function(){
				tokenFm.clean().remove();
			}
		);
		$('content-container').append(tokenFm);
	
	if (!defined(svc.list[i].userId)){
	//форма регистрации
		$('user-data').hide();
		$('user-login').show();
		var loginFm	= $('user-login').first('form');
		loginFm.onSubmit(
			function(evt){
				evt.stop();

				//регистрация пользователя
				svc.list[i].userId = loginFm.input("user_id").getValue();

				$('user-login').hide();
				$('user-data-name').text(svc.list[i].userId);
				$('user-data-descr').text('some description');
				$('user-data').show();

				displayService(svc, i);
			}
		)
	} else {
	//список проектов
		var projList = makeList(
			"Мои проекты"
			,"my-project-list"
			,[
				{
					name:"+"		//добавить проект (создать)
					,callback:newProject.curry(svc, displayService.curry(svc,i))
				}
				,{
					name:"O"   //обновить список
					,callback:function(){refreshProjectList(projList.first('.content'),svc)} 
				}
			]
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
								search:null}
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
				form.input("psid").setValue(crnt(prj).psid);
				//отправка запроса на создание
				form.send({
//					async:false,
					onSuccess:function(r){
						new Dialog().html(r.responseJSON.token).show();
						displayProject(prj, prj.i);
					}
					,onFailure:function(r){
						alert(r.responseText) 
					}
				});
			} 
			//обработка закрытияформы
			,function(){
				displayProject(prj, i);
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

function setPartData(prj, idParticipant){
	$("content-title").text('Регистрация на открытом проекте');
	$("content-description").text('заполните поля, бла бла бла');

	//форм формы
	$('content-container').clean().append(
		makeForm(
			$('edit-participant-template')  //шаблон формы
			,"edit-participant"
			,"данные участника" //заголовок формы
			//обработка сабмита
			,function(evt, form){
				form.set('action',domain+"/participant/change");
				if (defined(crnt(prj.parent).userId)) {
					form.input("user_id").setValue(crnt(prj.parent).userId);
				}
				form.input("uuid").setValue(idParticipant);
				form.input("psid").setValue(crnt(prj).psid);
				//отправка запроса на создание
				form.send({
//					async:false,
					onSuccess:function(r){
						refreshPartList(prj);
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

function refreshPartList(prj){
	aget('/participant/list'
		,{psid:crnt(prj).psid}
		,function(list){
			//обработка списка
			fillList(
				$('left-container')
				,list.map(function(item, i){ return {id:item.uuid,data:item};})
				,function(item,i){
					if (item.data.status == "denied") {return;}
					if (item.data.me) {
							$("participant-me").first(".name").text(item.data.name);
							addToolItems(
								$("participant-me").first(".panel")
								,[
									{
										name:"Ed."
										,callback:setPartData.curry(prj, item.id)
									}
								]
							);							
							return;
					}
					//формирование строк списка
					var e = $('participant-template').clone().set("id","part"+item.id).show();
					e.first(".title").text(item.data.name).set("title",item.data.descr);
					var toolItems=[];
					if (item.data.status == "accepted") {
						toolItems.push({name:"-"
											,callback:kickoutPart.curry(prj,item.id)
											});
					}
					if (item.data.status == "voted") {
						toolItems.push({name:"V"
											,callback:conformPart.curry(prj,item.id,"include")
											});
					}
					
					addToolItems(
						e.first('.tool-panel')
						,toolItems
					
					)
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


function displayProject(prj, i){
	prj.i = i;

	//готовим список доступных проектов для переключения
 	var tokens = [];
 	if (defined(crnt(prj.parent).userId)) {tokens.push(crnt(prj.parent).userId)}
 	tokens = tokens.concat(crnt(prj.parent).tokens);
	collectProjectList(tokens, []
		,function(list){
			//обновление навигации для сформированного списка
			var next = {
				parent : prj.parent
				,cbDisplay : enterProject
				,cbClose : function(){alert("close project")}
				,list : list
				
			} 
			list.each(
				function(item, j){
					if (item.id == crnt(prj).id) {
						//индекс текущего проекта в новом списке
						next.i = j;
						//формирование навигации
						displayNav(
							next
							,[
								{
									name:"Новое мероприятие"
									,callback:newActivity.curry()
								}
							]
						);
					}

				}			
			);
		}
	); 	


	//заголовок, описание проекта
	document.title=prj.list[i].data.name;
	$("content-title").text(prj.list[i].data.name+"     ("+prj.list[i].token+")");
	$("content-description").text(prj.list[i].data.descr);

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
			,selected: Object.keys(projectStatusList).indexOf(prj.list[i].data.status)
		}
	).insertTo(projAdm.first('.adm-status'));
	if (!sel.getValue()){
		sel.select(sel.first('li'));
	}
	sel.on('change',function(evt){
			if (evt.target.value != crnt(prj).status) {setProjectStatus(prj, evt.target.value);}
		}
	)

//участники
	//формируем список
	refreshPartList(prj);
	//формируем действия
	addToolItems(
		$E('div').setStyle({width:"100%"}).insertTo($('left-footer'))
		,[
			{
				name:"+"
				,callback:invitePart.curry(prj)
			}
			,{
				name:"O"
				,callback:refreshPartList.curry(prj)
			}
		]
		);

//параметры
	//список параметров
	var parList = makeList(
		"Параметры"
		,"proj-param-list"
		,[
			{
				name:"O"
				,callback:function(){refreshParamList(parList.first('.content'),prj.list[i])}
			}
		]
	).show();
	refreshParamList(parList.first('.content'),prj.list[i]);
	$("content-container").append(parList);
	//мероприятия
		
}


function closeProject(evt, prj) {

}

//Смена статуса проекта
//prj - данные проекта, 
//status - значение нового статуса
function setProjectStatus(prj, status) {
	apost('/project/status/change'
			,{psid:crnt(prj).psid,status:status}
			,function(r){
					crnt(prj).status = status;
			}
	);
}



function newActivity(evt, prj) {
	alert("New activation");	
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


var svc = {
	list:[
		{id:"gamma",data:{uuid:"gamma",name:"Собутыльники",descr:"Пьянки, гулянки",domain:"http:172.16.5.83:8080"}, psid:{}, tokens:[]}
		,{id:"beta",data:{uuid:"beta", name:"Оптовики",descr:"Оптовые заказы",domain:"http:172.16.5.83:8080"}, psid:{}, tokens:[]}
	]
	,i:0
};
svc.prj = {parent:svc, list:[], i:0};

displayService(svc, 0);


}

$(document).on('ready', begin);
