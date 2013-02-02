BaseMixin = function(){};

BaseMixin.contribute = function(target){
  target = target.extend(_.omit(this.prototype,'contribute','constructor'));
  return this.prototype.contribute(target);
}

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
  sort:function(e){
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

      listeners: _.defaults({}, target.prototype.listeners, {
        'itemview:toggle':"toggle"
      }),

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

  toggle:function(itemView){
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
  search: _.debounce(function(e){
    _super(SearchMixin, this, "search", true).call(this, e);
    var $el =  $(e.target).closest('[data-action]');
    var value = $el.val() || undefined;
    this.collection.refetch({data:{name__icontains:value}});
  }, 100)
});

WidgetMixin = BaseMixin.extend({
  initialize:function(){
    _super(WidgetMixin,this,'initialize',true).apply(this,arguments);

    if(!this.collection && this.type || !(this.collection instanceof this.type)){
      this.collection = new this.type();
    }


    this.bindListeners();

    if(this.collection){
      this.collection.fetch();
    }

    if(this.options.vent){
      this.on('change',function(value){
        this.options.vent.triggerMethod(this.name,value,this);
      }.bind(this))
    }
  }
});
