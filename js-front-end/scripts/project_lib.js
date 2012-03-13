//Функции 

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

//индекс эл-та массива для которого фцнкция вернет true
function idxById(arr, id) {
	var ret;
	arr.each(function(item,i){
		if (item.id == id) {ret = i; $break;}
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
							ret[i] = item.data[fld];
						})	
	return ret;
}

function crnt(wp){
	return wp.list[wp.i];
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
			selected: idxById(list, wp.id) ,
		}).hide()
		.addClass("nav-panel-selector")
		//обработчик выбора
		.delegate('click', 'li', function(){
				var j = this._value;
				this.parent().remove();
				wp.new(list[j]).display();
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
	var ttl = nav.first('.title').text(wp.data.name)
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
	$('tool-panels').append(makeToolPanel(wp, toolItems));			
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


//стандартный композатор элемента
//container - контейнер для элементов, 
//item - описание элемента {name:<имя элемента>, callback:<обработчик активации элемента>} 
//i - порядковый номер элемента
//function stdToolItemComposer(item, i){
//	return $E('span',{class:"button"})
//		.on('click', function(){item.callback();})
//		.text(item.name);
//}
//итератор композатором по списку элементов  
//container - контейнер для элементов, 
//toolItems - список описаний элементов, 
//function makeToolItems(toolItems) {
//	return container.insert(
//		toolItems.map(function(item, i){item.composer(item, i)})
//	);	
//}

//===========================================


//Наполнение списка строками на основе данных
//container - Элмент - контейнер для списка, 
//list - массив записей, 
//lineComposer - функция формирования элемента строки списка
function fillList(container, list, lineComposer){
//получаем массив скомпонованных элементов 
	var elements = list.map(lineComposer).filter(function(item, i){return defined(item)});
//вставка 
	container.clean().insert(elements);
}


//Композитор набора строк таблицы
//cols - описание колонок [{nm:<имя поля>,
//									 cls:<значене для аттрибура class ячейки>, - необяз.
//									 clsList:[<имя класса>]}], - необяз.
//dtlCol - имя поля с подробностями,
//list - список записей данных, 
//rowClassComposer - функция возвращающая имя сласса для строки, 
//toolItemsComposer - функция возвращающая набор активных элементов для строки, 
function makeRowSet(cols, dtlCol, list, rowClassComposer, toolItemsComposer) {
	//подготовка каталога колонок
	cols.walk(function(col,i){
		if (!defined(col.cls)) {
			col.cls = ["cell"].merge([col.nm],col.clsList).join(" ");
		}
	});
	return list.map(function(row, i){
			return makeRow(
				cols, dtlCol, row, i, rowClassComposer(row), toolItemsComposer(row)
			);
		})
}
//Композитор строки таблицы
//cols - массив описаний колонок [{nm:<имя поля>,
//									 		  cls:<значене для аттрибура class ячейки>}],
//dtlCol - имя поля с подробностями,
//row - строка данных (структура), 
//rowId - ид строки анных, 
//rowClass - массив имен классов для строки таблицы, 
//toolItems - массив активных элементов
function makeRow(cols, dtlCol, row, rowId, rowClass, toolItems) {
	//Формирование лементов
	return $E("div",{
			class:["row"].merge(rowClass).join(" ")
			,title:row[dtlCol]
		})
		//верхняя часть
		.append($E("div", {class:"fieldSet",row_id:rowId}).insert(
			cols.map(function(col, i){
				return $E("span",{
							class:col.cls
						})
						.text(row[col.nm]);
			})
		))
		//нижняя часть
		.append($E("div").insert(ToolItem.composeList(toolItems)));
}

