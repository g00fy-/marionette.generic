BaseMixin = function(){};

BaseMixin.contribute = function(target){
  target = target.extend(_.omit(this.prototype,'contribute','constructor','defaults'));
  _.defaults(target.prototype,this.prototype.defaults||{});
  return this.prototype.contribute(target)
};

_.extend(BaseMixin.prototype,{
  contribute:function(target){
    return target
  }
});

BaseMixin.extend = Marionette.extend;

function _super(type, instance, attr, safe){

  while(instance[attr] !== type.prototype[attr]){
    instance = instance.constructor.__super__;
  }
  while(instance[attr] === type.prototype[attr]){
    instance = instance.constructor.__super__;
  }

  var rv = instance[attr];

  if (_.isUndefined(rv) && safe){
    return new Function;
  } else {
    return rv;
  }
}


// ????? backbone.super

// function _super(type, instance, attr, safe){
//   var object = instance;
//   while(instance[attr] === object[attr]){
//     object = object.constructor.__super__;
//   }

//   var rv = object[attr];

//   if (_.isUndefined(rv) && safe){
//     return new Function;
//   } else {
//     return rv;
//   }
// }

SortMixin = BaseMixin.extend({
  onSort:function(e){
    var $el =  $(e.target).closest('[data-order]')
    var order = $el.data('order');
    var field = $el.data('field');
    if(order =='desc'){
      field = '-'+field;
      $el.data('order','asc')
    }else{
      $el.data('order','desc')
    }

    this.collection.refetch({data:{order:field}})
  }
});

MultiSelectMixin = BaseMixin.extend({
  contribute: function(target){
    return target.extend({

      itemView: target.prototype.itemView.extend({
        triggers:{
          "click .label":"toggle"
        }
      })
    });

  },

  onRender:function(){
    this.children.each(function(view){
      if(_.contains(this.options.selected,view.model.id)){
        view.$el.addClass('error');
      }
    },this);
  },

  onItemviewToggle:function(itemView){
    if(_.contains(this.options.selected,itemView.model.id)){
      this.options.selected = _.without(this.options.selected,itemView.model.id);
    }else{
      this.options.selected.push(itemView.model.id);
    }
    itemView.$el.toggleClass("error");
  },

  initialize:function(){
    this.bindListeners();
  }

});

SearchMixin = BaseMixin.extend({
  defaults:{
    buildSearchQuery:function(value){
      throw 'buildSearchQuery not defined';
    }
  },
  onSearch: _.debounce(function(e){
    _super(SearchMixin, this, "onSearch", true).call(this, e);
    var $el =  $(e.target).closest('[data-action]');
    var value = $el.val() || undefined;
    this.collection.refetch({data:this.buildSearchQuery(value)});
  }, 100)
});

WidgetMixin = BaseMixin.extend({
  initialize:function(){
    _super(WidgetMixin,this,'initialize',true).apply(this,arguments);

    if(!this.collection && this.type || !(this.collection instanceof this.type)){
      this.collection = new this.type();
    }
    this.bindListeners();
  },
  onChange:function(e){
    if(this.options.vent){
      this.options.vent.triggerMethod(this.name, _.result(this,'value'));
    }
  }
});



SelectMixin = BaseMixin.extend({
  onItemviewToggle:function(view){
    this.selected = view.model.id;
    this.triggerMethod('change');
  },
  value:function(){
    return this.selected;
  }
});


PaginatedMixin = BaseMixin.extend({
  defaults:{
    page:1,
    paginateBy:10,
    fetchOptions:{
      data:{}
    }
  },
  hasPrevPage:function(){
    return this.page>1
  },
  hasNextPage:function(){
    return this.collection.meta.total>(this.page)*this.paginateBy;
  },
  onNextPage:function(){
    if(this.hasNextPage()){
      this.fetchPage(this.page+1)
    }
  },
  onPrevPage:function(){
    if(this.hasPrevPage()){
      this.fetchPage(this.page-1)
    }
  },
  onGetPage:function(e){

  },
  fetchPage:function(page){
    return this.collection.refetch({
      data:{
        offset:this.paginateBy*(page-1),
        limit:this.paginateBy
      }
    });
  },
  onPageChanged:function(){
    if((this.ui||{}).currentPage){
      this.ui.currentPage.text(this.page);
    }
  },
  onSearch:function(){
    this.page = 1;
    delete this.collection.fetchOptions.data.offset;
    this.triggerMethod('page:changed');
    return _super(PaginatedMixin,this, 'onSearch',true).apply(this, arguments);
  },
  onRequestFinished:function(){
    var data = this.collection.fetchOptions.data
    this.page = Math.floor(
      (data.offset || 0) / this.paginateBy)+1;
    this.triggerMethod('page:changed');
    _super(PaginatedMixin,this,'onRequestFinished',true).apply(this,arguments);
  }

});

PrefetchListMixin = BaseMixin.extend({
  defaults:{
    fetchOptions:{
      data:{}
    }
  },
  initialize:function(){
    _super(PrefetchListMixin,this,'initialize',true).apply(this, arguments);
    this.prefetch(Marionette.getOption(this,'fetchOptions'));
  },
  prefetch:function(options){
    if(!options.data.limit){
      options.data.limit=this.paginateBy;
    }
    if(!this.collection.xhr){
      this.collection.refetch(options);
    }
  }
});

LoadingMixin = BaseMixin.extend({
  initialize:function(){
    _super(LoadingMixin,this,'initialize',true).apply(this,arguments);
    Marionette.bindEntityEvents(this,this.collection,{
      'request':this.triggerMethod.bind(this,'request'),
      'sync':this.triggerMethod.bind(this,'sync')
    });

  },
  onRequest:function(collection,xhr,options){
    xhr
      .fail(this.triggerMethod.bind(this,'request:fail'))
      .done(this.triggerMethod.bind(this,'request:done'))
      .always(this.triggerMethod.bind(this,'request:finished'));
    this.triggerMethod('request:start');
  }
});
