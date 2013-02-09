Generic = {
  action: function(event){
    console.log(event);
    if($(event.target).closest('[data-view]').attr('data-view')!=this.cid){
      return;
    }

    var action = $(event.target).closest('[data-action]').data('action');
    if (!action){
        // try to find action on this.$el
        action = this.$el.data('action');
    }
    console.log(event,action);
    this.triggerMethod(action,event);
  },
  actionEvents: function(){
    var events = {'click [data-action]':'action'};
    _.each( _.uniq(_.toArray(arguments)),function(name){
        events[name+" [data-action][data-on='"+name+"']"]='action'
    });
    return events
  },
  selected:function(view){

  }
};

Generic.defaults = {
  events:Generic.actionEvents('click','change','keyup'),
  action:Generic.action,
  // default events for model
  modelEvents: {
//    "change": "render"
    "sync":"render"
  },
  
  bindListeners:function(){
    var self = this;
    _.each(this.listeners||{},function(listener,trigger){
      if(!_.isFunction(listener)){
        if(!_.isFunction(self[listener])){
          throw 'listener '+listener+' is not callable';
        }
        listener = self[listener];
      }
      self.on(trigger,listener,self);

    });
  },

  selector:function(){
    return this.$('[data-bind]:not([data-view][data-view!='+this.cid+'] [data-bind])');
  },

  value:function(){
     var value = {};
     _.each(this.regionManagers,function(region,name){
        if(region.currentView){
            value[name]= _.result(region.currentView,'value');
        }
     });
     _.each(this.selector(),function(el){
        value[el.dataset['bind']]= $(el).val() || $(el).text();
     });
     return value
  }
};


Generic.ListItemView = Marionette.ItemView.extend(_.defaults({
  template: _.template('<%= data.id || data.cid %>'),
  tagName:'tr'
},Generic.defaults));

// Ready
Generic.DetailView = Marionette.Layout.extend(_.defaults({
    // template for currently fetching objects
    loadingTemplate:undefined,

    // action resolver - invokes action specified in data-action attribute
    action:Generic.action
},Generic.defaults));

//
Generic.EditView =  Generic.DetailView.extend({
   events: _.defaults({

   },Generic.DetailView.prototype.events)
});

// Ready
Generic.ListView = Marionette.CompositeView.extend(_.defaults({
    template: _.template('<table><thead><tr><th>Default header</th></tr></thead><tbody></tbody></table>'),
    itemView:Generic.ListItemView,
    itemViewContainer:"tbody",
    value:function(){
        if(this.options.selected){
            return this.options.selected
        }else{
            return this.collection;
        }
    }

},Generic.defaults), {
      mixin: function(){
      return _.reduceRight(arguments, function(current, mixin){
        return mixin.contribute(current);
      }, this);

    }
});

Generic.PageView = Marionette.Layout.extend(_.defaults({
    asideView:undefined,
    mainView:undefined,
    template: "#customer-page",
    regions: {
        main: "[data-region='main']",
        aside: "[data-region='aside']"
    },
    modelEvents:{},
//    modelEvents: {},
  render: function(){ 
    console.log("pageview render", this.cid); 
    return Marionette.Layout.prototype.render.apply(this, arguments)
  },
  onRender: function(){
    if(this.mainView){
        this.main.show(new this.mainView(this.options));
    }
    if(this.asideView){
        this.aside.show(new this.asideView(this.options));
    }
  }
},Generic.defaults));


//
//Generic.MultipleSelectView = Generic.ListView.extend({
//  template: _.template('<select multiple></select>'),
//  itemViewContainer:'select',
//  itemViewOptions:function(item){
//    return {
//        selected:_.contains(this.options.selected||[],item.id)
//    }
//  },
//  itemView:Generic.ListItemView.extend({
//    template: _.template('<%= data.name||data.id %>'),
//    tagName:'option',
//    attributes:function(){
//      return {
//          value:this.model.id,
//          selected:(this.options.selected)
//      }
//    }
//  })
//});


Generic.AsideView = Marionette.CollectionView.extend({
  widgets:[],

  initialize:function(){
    this.collection = new Backbone.Collection(_.map(this.widgets,function(widget){
      return {view:widget}
    }));
  },

  getItemView:function(item){
    return item.get('view');
  },

  itemViewOptions:function(){
    return this.options;
  }
});



MultipleSelectView = function(options){
    var View = this.getView()
    return new View(_.defaults(options,{selected:[]}));
};

MultipleSelectView.prototype.value = function(){
    return this.options.selected;
};


MultipleSelectView.prototype.getView = function(){
    var self = this;
    return this.view.extend(
      _.defaults(this.protoProps,{
        itemViewOptions:function(){
          var itemViewOptions = self.view.prototype.itemViewOptions || {};
          if(_.isFunction(itemViewOptions)){
            itemViewOptions = itemViewOptions.apply(this,arguments);
          }
          return _.extend({},itemViewOptions,this.options)
        }
      }),
      this.staticProps);
    };

MultipleSelectView.extend = function(protoProps,staticProps){
    var child = Backbone.View.extend.call(this, _.pick(protoProps||{},'view'));

    child.prototype.protoProps  = _.extend({},
        child.prototype.protoProps,
        _.omit(protoProps,'view')
    );
    child.prototype.staticProps = _.extend({},
        child.prototype.staticProps,
        staticProps
    );
    return child;
};


Generic.MultipleSelectView = MultipleSelectView;




Generic.ListWidget = Generic.ListView.extend({
  constructor:function(options){
    var options = _.clone(options)||{};
    options.collection = new this.type();
    Generic.ListView.call(this,options);
  },
  itemView:Generic.ListItemView.extend({
    template:"#aside-message-list-item",
    class:"media",
    tagName:'li'
  })
});
