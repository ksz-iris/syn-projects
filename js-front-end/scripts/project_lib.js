//Функции 

var domain;

function error(r) {
	alert(r.toString());	
}

function aget(url, pars, process) {
	new Xhr(
		domain+url
		,{
			method:'post'
			,onSuccess: function(r) {
				process(r.responseJSON, true, r);
			}
			,onFail: function(r) {
				process(r.responseJSON, false, r);
			}
			,onComplete: function(r) {
				if ((r.status < 500) && (r.status >= 400)) {process(r.responseJSON, false, r);}
			}
		}
	).send(pars);
}

function apost(url, _data, process) {
	new Xhr(
		domain+url
		,{
			method:'post'
			,onSuccess: function(r) {
				process(r.responseJSON, true, r);
			}
			,onFail: function(r) {
				error(r.responseJSON, false, r);
			}
			,onComplete: function(r) {
				if ((r.status < 500) && (r.status >= 400)) {process(r.responseJSON, false, r);}
			}
		}
	).send(_data);
	
}

//индекс эл-та массива для которого фцнкция вернет true
function idxById(arr, id) {
	var ret;
	arr.each(function(item,i){
		if (item.uuid == id) {ret = i; $break;}
	});
	return ret;
}

//подгонка размеров областей...
function resize(){
	var e = $('left-block').first('.rui-resizable-handle');
	var shiftLeft = e._.offsetLeft + e._.offsetWidth + 10;
	e = $('left-footer')
	e.setWidth(e.parent()._.style.width.toInt());
	$('right-block').moveTo(shiftLeft, 0);
	e = $('right-block');
	var shiftTop = e._.offsetTop + e._.offsetHeight;
	$('content-block').moveTo(shiftLeft, shiftTop);
}


//возвращает структуру вида {0:<val1>,1:<val2>...} полуенную из массива 
// list структур вида {f1:<val2>,f2:<val2>...} путем компоновки пар из 
// индекса структурыв массиве и значения ее поля заданного в fld  
function selOpt(list, fld){
	var ret={};
	list.each(function (item, i){
							ret[i] = item[fld];
						})	
	return ret;
}

//формирование формы
//ctl - шаблон формы 
//id - ид для элеменов формы и контейнера
//title - текст заголовка для формы
//sendCB - обработчик отправки данных формы
//closeCB - обработчик закрытияформы
function makeForm(ctl, id, title, sendCB, closeCB){
	//клоним шаблон формы
	var e = ctl.clone().set('id',id).show();  	
	//клоним шаблон рамки формы
	var holder = $('form-holder-template').clone().set('id',id+'-holder').show(); 
	//компонуем
	holder.first('.content').append(e);
	holder.first('.title').text(title);
	
	var form = holder.first('form');
	var btn = holder.find('.button');
	//назначаем обработчики
	btn[0].on('click', sendCB, form);
	btn[1].on('click', function(){
			form.reset();
		});
	btn[2].on('click', closeCB);	
	return holder;	
}


//*******************************************
//контентконтейнеры

//формирование постраничного списка
//title - заголовочек, 
//id - идентификатор элемента
//refreshCB - обработчик списка для страницы,
//closeCB - обработчик закрытия списка
function makePList(title, id, refreshCB, closeCB) {
	var pageNum = 0, ipp = 20;
	//клоним шаблон рамки списка	
	var plist = $('plist-holder-template').clone().set('id',id+'holder')
		//обработчики кнопок
		.delegate('click','.button', function(){
			//ToDo
			if (this.hasClass('prev')) { //пред страница
				if (pageNum > 0) {pageNum--;} else {}
			}
			//ToDo
			if (this.hasClass('next')) { //след страница
				pageNum++;	
			}
			//обновление
			if (this.hasClass('refresh')) {var pcnt = refreshCB(pageNum, ipp)}
			//ToDo настройка списка			
			if (this.hasClass('setup')) {}
			//закрытие
			if (this.hasClass('close')) {closeCB();}			
		});		
	//заголовок
	plist.first('.title').text(title);
	//пейджер
	
	//возврат
	return plist; 
}

//формирование простого списка
//title - заголовочек, 
//id - идентификатор элемента
//toolItems - список описаний активных элементов,
function makeList(title, id, toolItems) {
	//клоним шаблон рамки списка	
	var plist = $('list-holder-template').clone().set('id',id+'holder');
	//панель активных элементов
	plist.first('.handle').insert(
		ToolItem.composeList(toolItems)
	)
	//заголовок
	plist.first('.title').text(title);
	//пейджер
	//возврат
	return plist; 
}


//=========================================

/*****************************************
              Навигация
*****************************************/
//Формирование списка выбора объекта
//wpList - список,
//i - индекс текущего, 
//displayCB - функция обработки выбора
function showSelector(wp, container, position) {
	wp.list(function(list){
		new Selectable({
			options: selOpt(list,"name"),
			selected: idxById(list, wp.uuid) ,
		}).hide()
		.addClass("nav-panel-selector")
		//обработчик выбора
		.delegate('click', 'li', function(){
				var j = this._value;
				this.parent().remove();
				if (wp.uuid == list[j].uuid) {
					wp.display();
				} else {
					wp.new(list[j]).display();
				};
			}
		)
		.insertTo(container).moveTo(position).show();
	});
}
//формирование навигационной панели
//wp - данные объекта вида {current:idx,list:} 
//displayCB - функция показа рабочего пространства 
//closeCB - обработчик клика по кнопке закрытия
function makeNavPanel(wp) {
	var chain = [];
	if (defined(wp.parent)) {
		 chain = makeNavPanel(wp.parent)
	}
	
	//клон шаблона	
	var nav = $('nav-panel-template').clone().show();
	//обработка заголовка
	var ttl = nav.first('.title').text(wp.name)
		.on('click', function(){
				wp.display();
			}); //заголовок 
	//кнопки 
	var btns = nav.find('.button');
	btns[0].text("X").on('click', function(){
			wp.close()
		}); //назначение обработчика на закрытие
	//обработчикна вызовселектора
	btns[1].text("V").on('click', function(evt){
			showSelector(wp, nav, ttl.position());
		});
	chain.push(nav);
	return chain;		
}
//Обновление навигационной панели
//wp - объект (сервис, проект, мероприятие ...),
//displayCB - обработчик действия отобразить раб.область,
//closeCB - обработчик действия закрыть раб.область объекта,
//toolItems - список операций на панели инструменов {<name>,<callback>}
function displayNav(wp, toolItems){
//Нав. панели
	$("nav-panels").clean();

	$('nav-panels').insert(makeNavPanel(wp));
//Панели активных лементов
	$("tool-panels").clean();
	$('tool-panels').append(
		$E('div',{class:"tool-panel"}).insert(ToolItem.composeList(toolItems))
	);			
	//ресайз
	resize();	
}
//=========================================

//*****************************************
//генератор панели активных элементов
ToolItem = new Class({
	initialize: function(name, callback){
			this.name = name;
			this.callback = callback;
		}
	,compose: function() {ToolItem.compose(this);}
});
ToolItem.compose = function(toolItem){
	return $E('span',{class:"button"})
		.on('click', function(){toolItem.callback();})
		.text(toolItem.name);
}
ToolItem.composeList = function(toolItems){
	return toolItems.map(ToolItem.compose);
}
//===========================================

//*****************************************
//Popup
function makePopup(content, position, element) {
//	var timer;
	var popup = $E("div",
		{	class:"popup" 
			,onmouseout:function(evt){
				if (popup.get("captured")=="true") {
					element.timer = function(){
						popup.remove();
						element.set("poped", "false")
					}.delay(600);
				}
//				evt.stop();
			}
			,onmouseover:function(evt){
				element.timer.cancel(); 
				popup.set("captured", "true");
//				evt.stop();
			}
		}
	);
	element.parent().append(popup);
	if (isString(content)) {
		popup.text(content);
	} else {
		popup.insert(content);
	}
	if (popup.size().x > ($(window).size().x / 2) ) {popup.setWidth(($(window).size().x / 2).ceil()-10)}
	if (popup.size().y > ($(window).size().y / 2) ) {popup.setWidth(($(window).size().y / 2).ceil()-10)}
	if ((position.y+popup.size().y) > $(window).size().y) { position.y -= (popup.size().y + 10);}
	if ((position.x+popup.size().x) > $(window).size().x) { position.x -= (popup.size().x + 10);}
	popup.moveTo(position).show();
	element.set("poped", "true");	
	return popup;
}

function popup(content, position, element) {
	element.timer = function(){
		if (isFunction(content)) {content = content();} 
		if ((element.get("poped")!="true") && content) {
			var popup = makePopup(content, position, element);

			element.on("mouseout",function(evt){
				element.timer = function(){
					if (element.get("captured") != "true" ) {
						popup.remove()
						element.set("poped", "false")
					};
				}.delay(1000);
			});

		}
	}.delay(2000);		
	element.on("mouseout",function(evt){
		clearTimeout(element.timer); 
		evt.stop();
	})
}	


//===========================================

//*****************************************
//Композитор набора строк таблицы
//cols - описание колонок [{name:<имя поля>,
//									 clsList:[<имя класса>]
//									 onClick:function(evt, elt, row, rowId)
//									 popupProvider:function(row, rowId)}], - необяз.
//list - список записей данных, 
//options = {
//rowClassProvider - функция возвращающая имя сласса для строки, 
//toolItemsProvider - функция возвращающая набор активных элементов для строки,

//}
function makeRowSet(container, cols, list, options) {
	var rowOptions = {};
	//подготовка каталога колонок
	cols.walk(function(col,i){
		col.class = "cell ".concat([col.name]);
		if (defined(col.classList)) {
			col.class = ["cell"].merge([col.name],col.classList).join(" ");
		}
		return col;
	});

	//формирование результата
	container.clean().insert(list.map(function(row, i){ 
		rowOptions = {};
		//Класс строки
		if (isFunction(options.rowClassProvider)) {rowOptions.rowClass = options.rowClassProvider(row);}
		else if (isArray(options.rowClassProvider)) {rowOptions.rowClass = options.rowClassProvider.join(" ");}
		else {rowOptions.rowClass = options.rowClassProvider;}
		//активные элементы
		if (isFunction(options.toolItemsProvider)) {rowOptions.toolItems = options.toolItemsProvider(row)}
		else {rowOptions.toolItems = options.toolItemsProvider;}
		rowOptions.formGenerator = options.formGenerator;
		//Строка
		return makeRow(cols, row, i, rowOptions);
	}))
	//Обработка onCick ячеек
	if (container.delegates('click', '.cell')) {container.undelegate('click', '.cell');}
	container.delegate('click','.cell',function(evt,p1){
			cols.each(function(col,i){
				//вызываем обработчики для ячеек в колонкас с преоставленными обработчиками
				if (col.name == this.get('col_id')) {
					if (col.onClick) {
						col.onClick(list[this.get('row_id')], this.get('row_id'), this, evt);
					} else if (col.popupProvider && (this.get("poped") != "true")) {
						var popupContent = col.popupProvider;
						if (isFunction(popupContent)) {
							popupContent = popupContent(list[this.get('row_id')] ,this.get('row_id'))
						}
						if (popupContent) {
							var popup = makePopup(popupContent, evt.position(), this);
							this.on("mouseout", function(evnt){
								var timer = function(){
									if (popup.get("captured") != "true") {
										popup.remove();
										this.set("poped", "false");
									};
								}.bind(this).delay(1000);
							});
						}
					}
				}	
			}.bind(this))			
	});
	//Обработка задержки курсора на ячейках	
	if (container.delegates('mouseover', '.cell')) {container.undelegate('mouseover', '.cell');}
	container.delegate('mouseover','.cell',function(evt,p1){
			cols.each(function(col,i){
				if ((col.name == this.get('col_id')) && col.popupProvider) {
					popup(col.popupProvider.curry(list[this.get('row_id')] ,this.get('row_id'))
							,evt.position(),this);					
				}				
			}.bind(this));
	});
}
//Композитор строки таблицы
//cols - массив описаний колонок [{name:<имя поля>,
//									 		  cls:<значене для аттрибура class ячейки>,
//											  hintGenerator:function(row)->Element/[Element]}],
//dtlCol - имя поля с подробностями,
//row - строка данных (структура), 
//rowId - ид строки анных, 
//options{
//	rowClass, 
//	toolItems, 
//	checkable
//}	
function makeRow(cols, row, rowId, options) {
	var e; 
	//Формирование лементов
	var cont = $E("div",{
			class:"row"
			,row_id: rowId
			,checked: false
			,expanded: false
		});
	if (defined(options.rowClass)) {cont.setClass("row ".concat(options.rowClass));}
//	if (defined(options.hint)) {cont.title = options.hint;}
	var handle = $E("div",{class:"row-handle"}).insertTo(cont);
	//добавим маркировку
	if (defined(options.checkable)) {
		e = $E("span",{class:"checkbox"}).text("(_)");
		if (options.checkabe) {
			e.on('click', function(evt) {
				if (cont.checked) {this.text="(-)"; cont.checked = false;}
				else {this.text="(*)"; cont.checked = true;}
			});
		}		
		handle.append(e);
	}
	var body = $E("div",{class:"row-body"}).insertTo(cont);
	//верхняя часть
	body.append($E("div", {class:"fieldset", row_id:rowId}).insert(
		cols.map(function(col, i){
			var cell = $E("span",{
				class:col.class
				,row_id:rowId
				,col_id:col.name
			}).append($E("span",{class:"cell-text"}).text(row[col.name]));
			return cell;
		})
	));
	//нижняя часть
	if (isArray(options.toolItems)) {
		body.append($E("div").insert( ToolItem.composeList(options.toolItems) ));
	}
	return cont;

}

//********************************************
//                Диалоги
//*******************************************
//Просто диалог
function makeDialog(title, texts,toolItems){
	return [
		$E("div", {class:"dialog-title"}).text(title),
		$E("div", {class:"dialog-body"}).insert(
			texts.map(function(text,i){
				return $E("p").text(text)
			})
		),
		$E("div", {class:"dialog-tools"}).insert(
			ToolItem.composeList(toolItems)
		)
	];
}

//***********************************************
//Открытое голосование:
//variants:[
//  {<vote>,<text>,<toolItem>}
//]
//votes [{<uuid>, <vote>,...}]
//participants: [{<uuid>,<name>,...}]
function makeOpenVotingDialog(variants, votes, participants) {
	var voters = votes.distribute(	
		variants.map(function(variant, i){
			return function(vote, i){
				return vote.vote == variant.vote
			};	
		})
	).map(function(voting, i){
		return voting.map(function(vote, j){
			return participants.first(function(part, k){
				return part.uuid == (vote.voter || vote.uuid);
			}).name;
		});
	});
	
	var texts = []; toolItems = [];

	variants.each(function(variant,i){
		texts.push("Участники: "+voters[i].join(","));
		texts.push(variant.text);
		toolItems.push(variant.toolItem);
	});	
	return makeDialog("Голосование", texts, toolItems);
}


//**********************************************
//                  Misc
//*********************************************
function pile(arrayRec){
	var keys = arrayRec.keys();
	var result = [];
	var row = {};
	var rest = true;
	while (rest) {
		rest = false;
		row = {};
		keys.each(function(key,i){
			if (arrayRec[key].length > 0) {
				row[key] = arrayRec[key].shift();
				rest = true;
			}
		})
		if (rest) {result.push(row);} 
	}
	return result;	
}


Array.include({
	//devide this array to destinations
	distribute:function(checks){
		var result = checks.map(function(){return [];});
		this.each(function(item, i){
			checks.each(function(check,j){
				if (check(item,i)) {
					result[j].push(item);
				}
			})
		});
		return result;
	}
})


function _zerofy(number) {
  return (number < 10 ? '0' : '') + number;
}
function format(_date, format) {
    var i18n   = Calendar.i18n;
    var day    = _date.getDay();
    var month  = _date.getMonth();
    var date   = _date.getDate();
    var year   = _date.getFullYear();
    var hour   = _date.getHours();
    var minute = _date.getMinutes();
    var second = _date.getSeconds();

    var hour_ampm = (hour == 0 ? 12 : hour < 13 ? hour : hour - 12);

    var values    = {
      a: i18n.dayNamesShort[day],
      A: i18n.dayNames[day],
      b: i18n.monthNamesShort[month],
      B: i18n.monthNames[month],
      d: _zerofy(date),
      e: ''+date,
      m: (month < 9 ? '0' : '') + (month+1),
      y: (''+year).substring(2,4),
      Y: ''+year,
      H: _zerofy(hour),
      k: '' + hour,
      I: (hour > 0 && (hour < 10 || (hour > 12 && hour < 22)) ? '0' : '') + hour_ampm,
      l: '' + hour_ampm,
      p: hour < 12 ? 'AM' : 'PM',
      P: hour < 12 ? 'am' : 'pm',
      M: _zerofy(minute),
      S: _zerofy(second),
      '%': '%'
    };

    var result = format;
    for (var key in values) {
      result = result.replace('%'+key, values[key]);
    }

    return result;
  }
