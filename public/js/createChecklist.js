function createChecklist(checklist, index, container,string){
	var section = $('<section/>')
										.attr('id','todoapp')
										.addClass('checklist'+index+'_'+string)
										.attr('data-type',string)
										.appendTo(container);

	var header = $('<header/>')
							.attr('id','header')
							.attr('data-type',string)
							.appendTo(section);

	if (string === 'asset')
		var headerh1 = $('<h1/>')
									.text("checklist"+index)
									.appendTo(header);

	var headerh2 = $('<input/>')
								.attr('id','new-todo')
								.addClass('new-todo')
								.addClass(string)
								.attr("placeholder",string+"s")
								.attr('data-checklist',index)
								.attr('data-type',string)
								.appendTo(header);

	var mainSection = $('<section/>')
										.attr('id','main')
										.attr('data-type',string)
										.appendTo(section);

	var toggleAll = $('<input/>')
									.attr('id','toggle-all')
									.addClass('toggle-all')
									.attr('type','checkbox')
									.attr('data-checklist',index)
									.attr('data-type',string)
									.appendTo(mainSection);

	var ul = $('<ul/>')
					.attr('id','todo-list')
					.addClass(string+'_checklist'+index)
					.attr('data-type',string)
					.appendTo(mainSection);

	var arr;
	if (string === 'asset')
		arr = checklist.assets;
	else if (string === 'region')
		arr = checklist.regions;

	arr.forEach(function(item, arrIndex){
		var li = $('<li/>')
							.addClass('view')
							.attr('id',item)
							.attr('data-checklist', index)
							.attr('data-index', arrIndex)
							.attr('data-type',string)
							.appendTo(ul);

		var div = $('<div/>')
							.addClass('view')
							.attr('data-type',string)
							.appendTo(li);

		var input = $('<input/>')
								.addClass('toggle')
								.attr('type','checkbox')
								.attr('data-asset',item)
								.attr('data-type',string)
								.appendTo(div);

		var label = $('<label/>')
								.text(item)
								.attr('data-type',string)
								.appendTo(div);
	});

	var footer = $('<footer/>')
							.attr('id','footer')
							.attr('data-type',string)
							.appendTo(section);

	var footerSpan = $('<span/>')
									.attr('id','todo-count')
									.text(arr.length+" item(s)")
									.appendTo(footer);

}