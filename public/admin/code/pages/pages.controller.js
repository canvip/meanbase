'use strict';

angular.module('meanbaseApp')
  .controller('PagesCtrl', function ($scope, endpoints, helpers, toastr, api, crud, Auth, $timeout, $rootScope) {

    $scope.$parent.pageTitle = 'Pages';
    $scope.pagesFilter = '';
    $scope.filterByThisPage = '';
    $scope.menus = [];

    var p = $scope.p = new crud($scope, 'pages', api.pages);

    p.find({}, null, 'Could not get the pages');

    $scope.publishedStates = [
      {label: 'both', value: ''},
      {label: 'published', value: 'true'},
      {label: 'unpublished', value: 'false'}
    ];

    $scope.published = '';

    $scope.saveSettings = function(page, settings) {
      var previousUrl = page.url;
      if(page && page._id) {
        p.update(page, settings, page.title + ' updated', 'Could not update ' + page.title);
      } else if(page && !page._id) {
        p.create(page, page.title + ' created', 'Could not create ' + page.title).then(function(response) {
          $timeout(function() {
            componentHandler.upgradeAllRegistered()
          });
        });
      }

      p.toggleModal('isSettingsOpen', 'settings');
  	};

  	$scope.togglePublished = function(page) {
      var message = page.published? page.title + ' published.': page.title + ' unpublished.';
      var failure = page.published? 'Could not publish ' + page.title: 'Could not unpublish ' + page.title;

      $scope.p.update(page, {published: page.published}, message, failure).then(function() {
        api.menus.update({url: page.url}, {published: page.published});
      });
  	};

  	$scope.deletePage = function(page) {
      var message = page.title + " deleted";
      var failure = 'Could not delete ' + page.title;
      p.delete(page, page.title + ' unpublished.', message, failure).then(function(response) {
        api.menus.delete({url: page.url}, {published: page.published});
      });
      p.toggleModal('isDeleteOpen', 'pageToDelete');
  	};

    $scope.openSettingsModal = function() {
      var settings = {
        "author": Auth.getCurrentUser().name,
        "url": "/",
        "title": "",
        "tabTitle": "",
        "template": "page",
        "description": "",
        "published": true
      };

      console.log("$scope.settings", settings);

      p.toggleModal('isSettingsOpen', 'settings', settings)
    };

	  $scope.pageFilter = function(user) {
	  	return (user.title + user.url).toLowerCase().indexOf($rootScope.searchText.toLowerCase()) >= 0;
	  };
  });