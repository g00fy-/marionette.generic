BaseMixin = function(){};

BaseMixin.contribute = function(target){
  var contribution = _.omit.apply(
    _,
    [this.prototype,'contribute','constructor','defaults'].concat(this.prototype.defaults||[])
  );
  target = target.extend(contribution);

  _.defaults(target.prototype,this.prototype.defaults||{});

  _.defaults(target.prototype, _.pick.apply(_,[this.prototype].concat(this.prototype.defaults)));
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
    var options = {};
      options[field]=order;
    this.sort(options);
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

  onToggleItem:function(item,itemView){
    itemView.$el.toggleClass('error');
  },

  onItemviewToggle:function(itemView){
    if(_.contains(this.selected,itemView.value())){
      this.selected = _.without(this.selected, itemView.value());
    }else{
      this.selected.push(itemView.value());
    }
    this.triggerMethod("toggle:item",itemView.model || itemView.collection ,itemView);
    this.triggerMethod("change");
  },


  value: function(){
    return this.selected;
  }


});

SearchMixin = BaseMixin.extend({
  defaults:['buildSearchQuery'],
  onSearch: _.debounce(function(e){
    _super(SearchMixin, this, "onSearch", true).call(this, e);
    var $el =  $(e.target).closest('[data-action]');
    var value = $el.val() || undefined;
    this.search(value);
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
  defaults:['onItemviewToggle'],
  onItemviewToggle:function(view){
    this.selected = view.value();
    this.triggerMethod('change');
  },
  value:function(){
    return this.selected;
  }
});


PaginatedMixin = BaseMixin.extend({
  defaults:[
    'page','paginateBy','fetchOptions','fetchPage','hasPrevPage','hasNextPage'
  ],

  page:1,
  paginateBy:10,
  onRequestFinished:function(){
    this.triggerMethod('page:changed');
    _super(PaginatedMixin,this,'onRequestFinished',true).apply(this,arguments);
  },
  fetchPage:function(page){
    throw 'fetchPage not implemented'
  },
  hasPrevPage:function(){
      return this.page>1
  },
  hasNextPage:function(){
      return true;
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
  onPaginateByChanged:function(e){
    var $el = $(e.target).closest('[data-action]')
    this.paginateBy  = $el.attr('data-paginate-by') || $el.val();
    this.fetchPage(1);
  },
  onSearch:function(){
    this.page = 1;
    delete this.collection.fetchOptions.data.offset;
    this.triggerMethod('page:changed');
    return _super(PaginatedMixin,this, 'onSearch',true).apply(this, arguments);
  }
});

PrefetchListMixin = BaseMixin.extend({
  initialize:function(){
    _super(PrefetchListMixin,this,'initialize',true).apply(this, arguments);
    this.prefetch(this.fetchOptions);
  },
  prefetch:function(options){
    if(this.paginateBy){
        this.fetchPage(1);
        return;
    }
    if(!this.collection.xhr){
      this.collection.refetch(options);
    }
  }
});

LoadingMixin = BaseMixin.extend({
  defaults:['fetchOptions'],
  fetchOptions:{
    data:{}
  },
  initialize:function(){

    this.fetchOptions = _.clone(this.fetchOptions);
    this.fetchOptions.data = _.clone(this.fetchOptions.data||{});

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

RouterMixin = BaseMixin.extend({
  onRoute:function(e){
    var route, dataset, options = {};
    route = $(e.target).closest('[data-action=route]').attr('data-route');
    dataset = $(e.target).closest('[data-action=route]').data();
    _.each(dataset,function(value,key){
      if(key!='route' && key.indexOf('route')==0){
        options[key.toLowerCase().replace('route','')]=value;
      }
    });
    this.route(route,options);
  },
  route:function(name,options,extra){
    extra = extra || {trigger:true,replace:true};
    var path = (this.routes ||{})[name];
    if(!path){ console.error('route "'+name+'" not defined'); return;}
    var url = path;
    _.each(options,function(value,key){
      url = url.replace(':'+key,value);
    });
    if(url){
      Backbone.history.navigate(url,extra);
    }
  }
})