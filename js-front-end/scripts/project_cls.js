//Классы
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
			this.sList = [
				{id:"gamma",data:{uuid:"gamma",name:"Собутыльники",descr:"Пьянки, гулянки",domain:"http:172.16.5.83:8080"}, psid:{}, tokens:[]}
				,{id:"beta",data:{uuid:"beta", name:"Оптовики",descr:"Оптовые заказы",domain:"http:172.16.5.83:8080"}, psid:{}, tokens:[]}
			];
			this.$super(fields);
		}
	,new: function(fields) {
			return new Svc(fields);
		}
	,list: function(continuation){
			continuation(this.sList);
		}	
	,display:function() {
			displayService(this);		
		}
	,setUserId:function(val) {
			this.userId = val;
			this.sList.walk(function(item, i){
				if (item.id = this.id) {
					item.userId = this.userId;
				};
				return item;
			});
		}
	,setPsid:function(pid, psid) {
			this.psid[pid] = psid;
			this.sList.walk(function(item, i){
				if (item.id = this.id) {
					item.psid[pid] = psid;
				};
				return item;
			});
		}
	,setPsid:function(pid, psid) {
			this.psid[pid] = psid;
			this.sList.walk(function(item, i){
				if (item.id = this.id) {
					item.psid[pid] = psid;
				};
				return item;
			});
		}
	,addToken:function(token) {
			this.tokens.merge([token]);
			this.sList.walk(function(item, i){
				if (item.id = this.id) {
					item.tokens.merge([token]);
				};
				return item;
			});
		}
})

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
	,list: function(continuation){
 			var tokens = [];
 			if (defined(this.parent.userId)) {tokens.push(this.parent.userId)}
		 	tokens = tokens.concat(this.parent.tokens);
			Prj.collectList(tokens, [], 
				function(list){
					this.pList = list
					continuation(list);
				}
			)
		}  
	,display: function() {
		if (defined(this.parent.psid[this.id])) {
			this.psid = this.parent.psid[this.id];
			displayProject(this);
		} else {
			if (defined(this.token)) {
				apost('/project/enter/invitation', {uuid:this.id,token:this.token}
					,function(prj, r){
						prj.parent.tokens.push(prj.token);
						prj.psid = prj.parent.psid[prj.id] = r.psid;
						//регистрация успешна, показ проекта
						prj.display();
					}.curry(this)
				);
			} else if (defined(this.parent.userId)) {
				//запрос регистрации
				apost('/project/enter/invitation', {uuid:this.id,token:this.parent.userId}
					,function(prj, r){
						prj.psid = prj.parent.psid[prj.id] = r.psid;
						//регистрация успешна, показ проекта
						prj.display();
					}.curry(this)
				);
			} else {
				alert("Нет ни токена ни пользователя"); return;
			}
		}
	}
	
});
Prj.collectList = function (tokens, list, continuation) {
		if (tokens.length > 0) {
			aget('/project/list/userid', {user_id:tokens.shift()}
					,function(res){
						Prj.collectList(
							tokens
							,list.concat(res.map(function(item, i){return {id:item.uuid,data:item}}))
							,continuation
						);
					}
			);
		} else {
			continuation(list);
		}
	};

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
			aget('/activity/list'
				,{psid:this.parent.psid}
				,function(list){
						continuation(list.map(function(item, i){return {id:item.uuid,data:item}}));
					}
			);
		}
	,display: function(){
			displayActivity(this);
		}
});

Act.accept = function(prj, uuid, continuation, comment) {
	apost("/activity/public",
		{psid:prj.psid, uuid:uuid, comment:comment},
		continuation		
	);
}

Act.delete = function(prj, uuid, continuation) {
	apost("/activity/delete",
		{psid:prj.psid, uuid:uuid},
		continuation		
	);
}

Act.deny = function(prj, uuid, continuation, comment) {
	apost("/activity/deny",
		{psid:prj.psid, uuid:uuid, comment:comment},
		continuation		
	);
}
