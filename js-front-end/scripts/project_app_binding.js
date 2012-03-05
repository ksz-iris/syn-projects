var domain;

function aget(url, pars, process) {
	new Xhr(
		domain+url
		,{
			method:'post'
			,onSuccess:function(r){process(r.responseJSON)}
			,onFailure:function(r){alert(r.responseText)}
		}
	).send(pars);
}

function apost(url, _data, continuation) {
	new Xhr(
		domain+url
		,{
			method:'post'
			,onSuccess:function(r){continuation(r.responseJSON)}
			,onFailure:function(r){alert(r.responseText)}
		}
	).send(_data);
	
}

function collectProjectList(tokens, list, continuation) {
	if (tokens.length > 0) {
		aget('/project/list/userid', {user_id:tokens.shift()}
				,function(res){
					collectProjectList(
						tokens
						,list.concat(res.map(function(item, i){return {id:item.uuid,data:item}}))
						,continuation 
				);
				}
		);
	} else {
		continuation(list);
	}
}