//Классы

//Обновляемые данные
var LiveData = new Class(Observer, {
	EVENTS:['refresh']
	,lids: {}
	,initialize: function(getter, options){
		this.getter = getter;
		this.$super(options);
	}
	,live: function (delay) {LiveData.live(this, delay);return this;}
	,act: function(callback) {
		LiveData.act(this, callback);
		return this;
	}
	,die: function () { clearTimeout(this.timer); return this; }
	,once: function (id, callback) {
		if (defined(this.lids[id])){
			this.stopObserving(this.lids[id]);
		}
		this.lids[id] = callback;
		return this.on('refresh',callback);
	}
});

LiveData.live = function (ld,delay) {
	delay = delay || 20000;
	ld.getter(function(data, isOk, r){
		if (isOk) {
			ld.data = data;
			ld.fire('refresh', data);
			clearTimeout(this.timer);
			ld.timer = setTimeout(LiveData.live.curry(ld, delay),delay);
		} else {

		}
	});
}

LiveData.act = function (ld, callback) {
	ld.getter(function(data, isOk, r){
		if (isOk) {
			ld.data = data;
			ld.fire('refresh', data);
			if (isFunction(callback)) { callback(data); }
		} else {

		}
	});
}


var DataFarm = {
	farm : {},
	plant : function(id, getter, options) {
		if (defined(this.farm[id])) {
			this.farm[id].die();
		}
		this.farm[id] = new LiveData(getter, options);
		return this.farm[id];  
	} 
}

var AO = new Class(
{
	initialize: function(fields) {
		Object.keys(fields).each(function (ao, item, i){
				ao[item] = fields[item];
			}.curry(this)
		);
	}
});


//Сервисы
var Svc = new Class(AO,
{
	initialize: function(fields){
		this.$super(fields);
	}
	,new: function(fields) {
		return new Svc(fields);
	}
	,list: function(continuation){
		continuation(Svc.sList);
	}			
	,display:function() {
		if (!defined(this.pList)) {
			this.pList = DataFarm.plant('Svc.pList',
				function(doLive, svc){
	 				var tokens = [];
 					if (defined(svc.userId)) {tokens.push(svc.userId)}
			 		tokens = tokens.concat(svc.tokens);
					Prj.collectList(tokens, [], doLive); 
				}.rcurry(this)
			).live();
		} else {
			this.pList.act();
		}
		displayService(this);
		return this;		
	}
	,setUserId:function(userId) {
		this.userId = userId;
		var uuid = this.uuid;
		Svc.sList.walk(function(item, i){
			if (item.uuid == uuid) {
				item.userId = userId;
			};
			return item;
		});
		return this;		
	}
	,setPsid:function(pid, psid) {
		this.psid[pid] = psid;
		uuid = this.uuid;
		Svc.sList.walk(function(item, i){
			if (item.uuid == uuid) {
				item.psid[pid] = psid;				
			};
			return item;
		});
		return this;		
	}
	,addToken:function(token) {
		this.tokens.merge([token]);
		uuid = this.uuid;
		Svc.sList.walk(function(item, i){
			if (item.uuid == uuid) {
				item.tokens.merge([token]);
			};
			return item;
		});
		return this;		
	}
})
Svc.sList = [
			{uuid:"gamma",name:"Собутыльники",descr:"Пьянки, гулянки",domain:"http://172.16.5.83:8080/services", psid:{}, tokens:[]}
			,{uuid:"beta", name:"Оптовики",descr:"Оптовые заказы",domain:"http://172.16.5.83:8080/services", psid:{}, tokens:[]}
		];




//Проекты
var Prj = new Class(AO,
{
	initialize: function(svc, fields){
			this.parent = svc;
			this.$super(fields);
		}
	,new: function(fields) {
			return new Prj(this.parent, fields);
		}
	,list: function(continuation){continuation(this.parent.pList.data);}
	,display: function() {
		if (defined(this.parent.psid[this.uuid])) {
			this.psid = this.parent.psid[this.uuid];
			if (!defined(this.partList)) {
				this.partList = DataFarm.plant('Prj.partList',
					function(doLive, prj){
						aget('/participant/list', {psid:prj.psid}, doLive); 
					}.rcurry(this)
				).live();
	
				this.prmList = DataFarm.plant('Prj.prmList',
					function(doLive, prj){
						aget('/project/parameter/list', {psid:prj.psid}, doLive); 
					}.rcurry(this)
				).live();
	
				this.actList = DataFarm.plant('Prj.actList',
					function(doLive, prj){
						aget('/activity/list', {psid:prj.psid}, doLive); 
					}.rcurry(this)
				).live();

				this.resList = DataFarm.plant('Prj.resList',
					function(doLive, prj){
						aget('/activity/resource/list', {psid:prj.psid}, doLive); 
					}.rcurry(this)
				).live();
			} else {
				this.partList.act();
				this.prmList.act();
				this.actList.act();
				this.resList.act();
			}
			displayProject(this);
		} else {
			if (defined(this.parent.userId)) {
				//запрос регистрации
				apost('/project/enter/invitation', {uuid:this.uuid,token:this.parent.userId}
					,function(prj, r){
						prj.psid = prj.parent.psid[prj.uuid] = r.psid;
						//регистрация успешна, показ проекта
						prj.display();
					}.curry(this)
				);
			} else if (defined(this.token)) {
				apost('/project/enter/invitation', {uuid:this.uuid,token:this.token}
					,function(prj, r){
						prj.parent.tokens.push(prj.token);
						prj.psid = prj.parent.psid[prj.uuid] = r.psid;
						//регистрация успешна, показ проекта
						prj.display();
					}.curry(this)
				);
			} else {
				alert("Нет ни токена ни пользователя"); return;
			}
		}
	}
	,invitePart: function(values, continuation) { Part.invite(this, values, continuation); }
	,resPartResListReport: function(continuation) {	Prj.resPartResListReport(this.psid, this.uuid, continuation); }
});

Prj.create = function (svc, values, continuation) {
	if (defined(svc.userId)) {
		values.user_id = svc.userId;
	}
	apost("/project/create", values, function(resp, isOk, r){
		//запрос создания успешен, создаем объект Act и передаем в continuation
		svc.pList.act(function(list, isOk, r){
			if (isOk) {			
				//получен новый список мероприятий
				continuation(new Prj(svc,
					//отдаем запись с uuid нового мероприятия
					list.filter(function(item,i){return item.uuid == resp.uuid}).first()
				));
			} else {
				svc.display();
			}
		});
	});	
}

Prj.collectList = function (tokens, list, continuation) {
		if (tokens.length > 0) {
			var token = tokens.shift();
			aget('/project/list/userid', {user_id:token}
					,function(res, isOk, r){
						Prj.collectList(
							tokens
							,list.concat(res.map(function(line,i){
								line.token = token; 
								return line;
							}))
							,continuation
						);
//						continuation(list, isOk, "");
					}
			);
		} else {
			continuation(list, true, "");
		}
	};

Prj.resPartResListReport = function(psid, uuid, continuation){
	apost("/participant/report",
		{psid:psid, uuid:uuid},
		function(resp, isOk, r){
			if (defined(continuation)) {continuation(resp, isOk, r)};
		}		
	);	
}

//Участник
var Part = new Class(AO,
{
	initialize: function(prj, fields) {
		this.parent = prj;
		this.$super(fields);
	}	
	,setData: function(values, continuation){ Part.setData(this.parent, values, continuation)}
	,include: function(continuation, comment){ Part.include(this.parent, this.uuid, continuation)}
	,exclude: function(continuation, comment){ Part.exclide(this.parent, this.uuid, continuation)}
	,kickout: function(continuation, comment){ Part.kickout(this.parent, this.uuid, continuation, comment)}
	
});

Part.invite = function (prj, values, continuation) {
	values.psid = prj.psid;
	apost("/participant/invite",
		values,
		function(resp, isOk, r) {
			if (defined(continuation)) {continuation(resp, isOk, r)};
			if (isOk) {prj.partList.act();}
		}		
	);	
}

Part.setData = function(prj, values, continuation) {
//	values.psid = prj.psid;
	if (defined(prj.parent.userId)) {
		values.user_id = prj.parent.userId;
	}
	apost("/participant/change",
		values,
		function(resp, isOk, r) {
			if (defined(continuation)) {continuation(resp, isOk, r)};
			if (isOk) {prj.partList.act();}
		}		
	);	
}
//Устаревшее
Part.kickout = function(prj, uuid, continuation, comment) {
	apost("/participant/exclude",
		{psid:prj.psid, uuid:uuid, comment:comment},
		function(resp, isOk, r){
			if (defined(continuation)) {continuation(resp, isOk, r)};
			if (isOk) {prj.partList.act();}
		}		
	);
}

//запрос на согласие на предложение по участнику
//prj - данные проекта, 
//uuid - код участника
Part.include = function (prj, uuid, continuation) {
	apost('/participant/vote/conform', 
		{psid:prj.psid,uuid:uuid, vote:"include"}
		,function(resp, isOk, r){
			if (defined(continuation)) {continuation(resp, isOk, r);}
			if (isOk) {prj.partList.act();}
		}
	);
}
//запрос на несогласие на предложение по участнику
//prj - данные проекта, 
//uuid - код участника
Part.exclude = function (prj, uuid, continuation) {
	apost('/participant/vote/conform', 
		{psid:prj.psid,uuid:uuid, vote:"exclude"}
		,function(resp, isOk, r){
			if (defined(continuation)) {continuation(resp, isOk, r);}
			if (isOk) {prj.partList.act();}
		}
	);
}


//Мероприятия
var Act = new Class(AO,
{
	initialize: function(prj,fields){
			this.parent = prj;
			this.$super(fields);
		}	
	,new: function(fields) {
			return new Act(this.parent, fields);
		}
	,list: function(continuation){
			continuation(this.parent.actList.data.filter(function(item,i){return item.status != "denied"}) );
//			Act.list(this.parent
//				,continuation
//			);
		}
	,display: function(){
			if (!defined(this.prmList)) {
				this.prmList = DataFarm.plant('Act.prmList',
					function(doLive, act){
						aget('/activity/parameter/list', {psid:act.parent.psid, uuid:act.uuid}, doLive); 
					}.rcurry(this)
				).live();

				this.partList = DataFarm.plant('Act.partList',
					function(doLive, act){
						aget('/activity/participant/list', {psid:act.parent.psid, uuid:act.uuid}, doLive); 
					}.rcurry(this)
				).live();
	
				this.resList = DataFarm.plant('Act.resList',
					function(doLive, act){
						aget('/activity/resource/list', {psid:act.parent.psid, uuid:act.uuid}, doLive); 
					}.rcurry(this)
				).live();
			} else {
				this.prmList.act();
				this.partList.act();
				this.resList.act();
			}
			displayActivity(this);
		}
	,accept: function(comment, continuation){
		Act.accept(this.parent, this.uuid, continuation);	
	}
	,public: function(comment, continuation){
		Act.public(this.parent, this.uuid, continuation, comment);	
	}
	,deny: function(comment, continuation){
		Act.deny(this.parent, this.uuid, continuation, comment);	
	}
	,delete: function(continuation){
		Act.delete(this.parent, this.uuid, continuation);	
	}	
	,participate: function(continuation){
		Act.participate(this.parent, "include", this.uuid, continuation);	
	}	
	,unParticipate: function(continuation){
		Act.participate(this.parent, "exclude", this.uuid, continuation);	
	}	
});

Act.create = function(prj, values, continuation) {
	values.psid = prj.psid;
	apost("/activity/create", values, function(resp, isOk, r){
		if (isOk) {
			//запрос создания успешен, создаем объект Act и передаем в continuation
			prj.actList.act(function(list){
				//получен новый список мероприятий
				continuation(new Act(prj,
					//отдаем запись с uuid нового мероприятия
					list.filter(function(item,i){return item.uuid == resp.uuid}).first()
				));
			});
		} else {
			prj.display();
		}
	});
}

Act.accept = function(prj, uuid, continuation) {
	apost("/activity/public",
		{psid:prj.psid, uuid:uuid},
		function(resp, isOk, r) {
			if (defined(continuation)) {continuation(resp, isOk, r)};
			if (isOk) {prj.actList.act();}
		}		
	);
}

Act.public = function(prj, uuid, continuation, comment) {
	apost("/activity/public",
		{psid:prj.psid, uuid:uuid, comment:comment},
		function(resp, isOk, r) {
			if (defined(continuation)) {continuation(resp, isOk, r)};
			if (isOk) {prj.actList.act();}
		}		
	);
}

Act.delete = function(prj, uuid, continuation) {
	apost("/activity/delete",
		{psid:prj.psid, uuid:uuid},
		function(resp, isOk, r) {
			if (defined(continuation)) {continuation(resp, isOk, r)};
			if (isOk) {prj.actList.act();}
		}		
	);
}

Act.deny = function(prj, uuid, continuation, comment) {
	apost("/activity/deny",
		{psid:prj.psid, uuid:uuid, comment:comment},
		function(resp, isOk, r) {
			if (defined(continuation)) {continuation(resp, isOk, r)};
			if (isOk) {prj.actList.act();}
		}		
	);
}

Act.participate = function(prj, action ,uuid, continuation) {
	apost("/activity/participation",
		{psid:prj.psid, action:action, uuid:uuid},
		function(resp, isOk, r) {
			if (defined(continuation)) {continuation(resp, isOk, r)};
			if (isOk) {prj.actList.act();}
		}		
	);
}


//Act.list = function(prj, continuation) {
//	aget('/activity/list'
//		,{psid:prj.psid}
//		,function(resp, isOk, r) {
//			if (defined(continuation)) {continuation(resp, isOk, r)};
//			prj.actList.act();
//		}		
//	);
//}

//Ресурсы
//Ресурсы проекта
var Res = new Class(AO, {
	initialize: function(prj, fields) {
		this.parent = prj;
		this.$super(fields);
	}
	,includeTo: function(act, values, continuation) {
		values.psid = this.parent.psid;
		values.uuid = this.uuid;
		values.activity = act.uuid;
		if (defined(values.need)) {values.need = true;} else {values.need = false;}
		Res.includeTo(act, values, continuation);
	}
	,exclude:function(act, continuation){
		Res.exclude(act, this.uuid, continuation);
	}
});

Res.create = function(prj, values, continuation) {
	values.psid = prj.psid;
	apost("/resource/create", 
		values, 
		function(resp, isOk, r){
			if (defined(continuation)) {continuation(resp, isOk, r);}	
			if (isOk) {prj.resList.act();}

//			function(list){
			//получен новый список мероприятий
//			continuation(new Act(prj,
				//отдаем запись с uuid нового мероприятия
//				list.filter(function(item,i){return item.uuid == resp.uuid}).first()
//			));
//		});
	});	
}

Res.exclude = function(act, uuid, continuation){
	apost("/activity/resource/exclude",
		{psid:act.parent.psid, uuid:uuid, activity:act.uuid},
		function(resp, isOk, r) {
			if (defined(continuation)) {continuation(resp, isOk, r)};
			if (isOk) {act.resList.act();}
		}		
	);
}

Res.includeTo = function(act, values, continuation){
//	{psid:act.parent.psid, uuid:uuid, activity:act.uuid, need:mandatory, amount:amount, comment:comment},
	apost("/activity/resource/include",
		values,
		function(resp, isOk, r) {
			if (defined(continuation)) {continuation(resp, isOk, r)};
			if (isOk) {act.resList.act();}
		}		
	);
}

Res.use = function(act, uuid, amount, continuation) {
	apost("/participant/resource/use",
		{psid:act.parent.psid, uuid:uuid, activity:act.uuid, amount:amount},
		function(resp, isOk, r) {
			if (defined(continuation)) {continuation(resp, isOk, r)};
//			if (isOk) {act.resList.act();}
		}		
	);
}
Res.costChange= function(prj, values, continuation) {
	apost("/resource/cost/change",
		values,
		function(resp, isOk, r) {
			if (defined(continuation)) {continuation(resp, isOk, r)};
			if (isOk) {act.resList.act();}
		}		
	);

}
