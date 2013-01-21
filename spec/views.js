describe("DetailView", function () {
  var DetailView = Generic.DetailView.extend({
    template: _.template('loaded'),
    loadingTemplate: _.template('loading')
  });
  var loadingView = new DetailView({model:new (Backbone.Model.extend({_loading:true}))});
  var loadedView = new DetailView({model:new (Backbone.Model.extend({_loading:true}))});

  loadedView.render();
  loadedView.model._loading=false;

  it('returns loadingTemplate when model is not yet fetched', function () {
    loadingView.render();
    expect(loadingView.$el.html()).toEqual('loading')
  });


  it('returns regular template when model is fetched', function () {
    loadedView.model.trigger('reset');
    expect(loadedView.$el.html()).toEqual('loaded')
  });
});