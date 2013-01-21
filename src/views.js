Generic = {
  action: function(event){
    var action = $(event.target).closest('[data-action]').data('action');
    if (!action){
        // try to find action on this.$el
        action = this.$el.data('action');
    }
    if (typeof this[action] == 'function'){
        event.stopPropagation();
        this[action](event);
    }
    this.trigger('action:'+action);
  },
  actionEvents: function(){
    var events = {
        "click [data-action]:not([data-on])":"action"
    };
    for(var i in arguments){
        var name = arguments[i];
        events[name+" [data-action][data-on='"+name+"']"]='action'
    }
    return events
}
};

Generic.defaults = {
  events:Generic.actionEvents('mouseover','mousein','mousemove','click','focus','dblclick'),
  action:Generic.action,
  // default events for model
  modelEvents: {
    "change": "render",
    "reset":"render"
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
    action:Generic.action,

    // returns loading template for loading model
    getTemplate:function(){
        if(this.model._loading && this.loadingTemplate){
          console.log(this.template,'test');
          return this.loadingTemplate;
        }else{
            return Marionette.Layout.prototype.getTemplate.apply(this)
        }
    }
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
},Generic.defaults));

Generic.PageView = Marionette.Layout.extend(_.defaults({
    asideView:undefined,
    mainView:undefined,
    template: "#customer-page",
    regions: {
        main: "[data-region='main']",
        aside: "[data-region='aside']"
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


ListWidget = Generic.ListView.extend({
    otherEvents:{},
    constructor:function(options){
        if(!options.collection && this.type){
            this.collection = new this.type();
        }
        Generic.ListView.apply(this,arguments);
        _.each(this.otherEvents,function(callback,event){
             this.on(event,this[callback]);
        }.bind(this));
    }
});


Generic.MultipleSelectView = Generic.ListView.extend({
  template: _.template('<select multiple></select>'),
  itemViewContainer:'select',
  itemViewOptions:function(item){
    return {
        selected:_.contains(this.options.selected||[],item.id)
    }
  },
  itemView:Generic.ListItemView.extend({
    template: _.template('<%= data.name||data.id %>'),
    tagName:'option',
    attributes:function(){
      return {
          value:this.model.id,
          selected:(this.options.selected)
      }
    }
  })
});


Generic.AsideView = Marionette.CollectionView.extend({
  widgets:[],
  initialize:function(){
    this.collection = new Backbone.Collection(_.map(this.widgets,function(widget){return {view:widget}}));
  },
  getItemView:function(item){
    return item.get('view');
  },
  itemViewOptions:function(){
    return this.options;
  }
});