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
    var $el =  $(e.target).closest('[data-order]');
    var order = $el.attr('data-order') || 'desc';
    var field = $el.attr('data-field');
    if(order == 'desc'){
      $el.attr('data-order','asc')
    }else{
      $el.attr('data-order','desc')
    }
    this.collection.refetch({data:this.buildSortQuery(field,order)})
  },
  defaults:{
      buildSortQuery:function(field,order){
          throw 'buildSortQuery undefined';
      }
  }
});

MultiSelectMixin = BaseMixin.extend({
  contribute:function(type){
    if(type.prototype.itemView.prototype.value){
      return type
    }
    return type.extend({
      itemView:type.prototype.itemView.extend({
        value:function(){
          return this.model.id;
        }
      })
    })
  },

  initialize: function(){
    this.selected = this.options.selected || [];
    _super(MultiSelectMixin, this, "initialize", true).apply(this, arguments);
  },
  onRender:function(){
    this.children.each(function(view){
      if(_.contains(this.selected,view.model.id)){
        view.$el.addClass('error');
      }
    },this);
  },

  onItemviewToggle:function(itemView){
    if(_.contains(this.selected,itemView.value())){
      this.selected = _.without(this.selected, itemView.value());
    }else{
      this.selected.push(itemView.value());
    }
    itemView.$el.toggleClass("error");
    this.triggerMethod("change");
  },

  value: function(){
    return this.selected;
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
  }, 500)
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
  contribute:function(type){
    if(type.prototype.itemView.prototype.value){
      return type
    }
    return type.extend({
      itemView:type.prototype.itemView.extend({
        value:function(){
          return this.model.id;
        }
      })
    })
  },
  defaults:{
    onItemviewToggle:function(view){
      this.selected = view.value();
      this.triggerMethod('change');
    }
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
    },
    onRequestFinished:function(){
      var data = this.collection.fetchOptions.data
      this.page = Math.floor(
        (data.offset || 0) / this.paginateBy)+1;
      this.triggerMethod('page:changed');
      _super(PaginatedMixin,this,'onRequestFinished',true).apply(this,arguments);
    },
    fetchPage:function(page){
      return this.collection.refetch({
        data:{
          offset:this.paginateBy*(page-1),
          limit:this.paginateBy
        }
      });
    },
    hasPrevPage:function(){
        return this.page>1
    },
    hasNextPage:function(){
        return this.collection.meta.total>(this.page)*this.paginateBy;
    }
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
