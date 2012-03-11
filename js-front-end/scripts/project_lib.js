//Классы
//Проекты
var Prj = new Class(
{
	initialize: function(svc){
			this.parent = svc
		}
	,list: function(continuation){
 			var tokens = [];
 			if (defined(this.parent.userId)) {tokens.push(this.parent.userId)}
		 	tokens = tokens.concat(this.parent.tokens);
			this.collectList(tokens, [], )
		}  
	,collectList:function (tokens, list, continuation) {
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
});
//Мероприятия
var Act = new Class(
{
	initialize: function(prj, list, i){

		}	
});


//Функции 

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
	addToolItems(
		plist.first('.handle')
		,toolItems
	)
	//заголовок
	plist.first('.title').text(title);
	//пейджер
	//возврат
	return plist; 
}

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
//=========================================

/*****************************************
              Навигация
*****************************************/
//Формирование списка выбора объекта
//wpList - список,
//i - индекс текущего, 
//displayCB - функция обработки выбора
function makeSelector(wp) {
	return new Selectable({
		options: selOpt(wp.list(),"name"),
		selected: wp.i,
	}).hide()
		.addClass("nav-panel-selector")
		//обработчик выбора
		.delegate('click', 'li', function(){
				var j = this._value;
				this.parent().remove();
//				wp.list[i].nav.hide();
				wp.cbDisplay(wp, j);
			}
		);
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
	var ttl = nav.first('.title').text(wp.list[wp.i].data.name)
		.on('click', function(){
				wp.cbDisplay(wp, wp.i)
			}); //заголовок 
	//кнопки 
	var btns = nav.find('.button');
	btns[0].text("X").on('click', function(){
			wp.cbClose()
		}); //назначение обработчика на закрытие
	//обработчикна вызовселектора
	btns[1].text("V").on('click', function(evt){
			makeSelector(wp)
			.insertTo(nav)
			.moveTo(ttl.position()).show();
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

//стандартный композатор элемента
//container - контейнер для элементов, 
//item - описание элемента, должно содержать поля исользуемые в композаторе, 
//i - порядковый номер элемента
function stdToolItemComposer(container, item, i){
				container.append(
					$E('span',{class:"button"})
					.on('click', function(){item.callback();})
					.text(item.name)
				);					
}
//итератор композатором по списку элементов  
//container - контейнер для элементов, 
//toolItems - список описаний элементов, 
//itemComposer - функция генерации элемента
function addToolItems(container, toolItems, itemComposer) {
		if (!defined(itemComposer)) {itemComposer=stdToolItemComposer;}
		toolItems.each(function(item, i){itemComposer(container, item, i)});
		return container;	
}

//стандартная панель кнопок...
function makeToolPanel(wp, toolItems) {
		wp.tool = $E('div',{class:"tool-panel"});
		return addToolItems(wp.tool, toolItems);
}
//===========================================

