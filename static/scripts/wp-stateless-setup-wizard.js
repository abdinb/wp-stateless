jQuery(document).ready(function ($) {
	var statelessWrapper = jQuery('#wp-stateless-wrapper');

	var setupStepContainer = statelessWrapper.find('.wpStateLess-setup-step');
	var setupStepsBars = setupStepContainer.find('.wpStateLess-setup-step-bars');
	var setupSteps = setupStepContainer.find('.wpStateLess-s-step');
	var stepSetupProject = setupSteps.find('.step-setup-project');
	var userInfo = setupSteps.find('.wpStateLess-userinfo');
	var userDetails = userInfo.find('.wpStateLess-user-detais');
	var setupForm = setupSteps.find('.wpStateLess-step-setup-form');
	var projectDropdown = setupForm.find('.wpStateLess-combo-box.project');
	var bucketDropdown = setupForm.find('.wpStateLess-combo-box.bucket');
  	var billingDropdown = setupForm.find('.wpStateLess-combo-box.billing-account');
  	var noBillingButton = billingDropdown.parent().find('.create-billing-account.no-billing-account');

	var checkAuthentication = function checkAuthentication(options){
		// Checking if we have access token is session.
		if(!wp.stateless.getAccessToken(options)){
			// We don't have access token.
			setupStepsBars.find('li').removeClass('wpStateLess-done');
			setupSteps.removeClass('active')
				.filter('.step-google-login')
				.addClass('active');
			return false;
		}
		else{
			// We have access token.
			setupStepsBars.find('li')
				.removeClass('wpStateLess-done')
				.filter('.step-google-login')
				.addClass('wpStateLess-done');
			setupSteps.removeClass('active')
				.filter('.step-setup-project')
				.addClass('active');
			return true;
		}
	};

	var listBillingAccounts = function listBillingAccounts() {
		return wp.stateless.listBillingAccounts()
		  .done(function(accounts){
		  	if(accounts && accounts.length){
		  		noBillingButton.hide();
				billingDropdown.wpStatelessComboBox({items:accounts, selected: 0}).show();
				billingDropdown.find('.name').trigger('change');
		  	}
			else{
				billingDropdown.hide();
		  		noBillingButton.show();
			}
		  });
	}

	// Remove any warning shown.
	statelessWrapper.siblings().remove();

	setupForm.find('.wpStateLess-combo-box.project .name').wppStatelessValidate({
		name: {
			empty:{
				break: true,
				regex: /.+/,
				errorMessage: 'Project name can\'t be empty.',
			},
			length:{
				regex: /^.{5,30}$/,
				errorMessage: 'Project name must be between 5 and 30 characters.',
			},
			char:{
				regex: /^[a-zA-Z0-9-'"\s!]+$/,
				errorMessage: 'Project name has invalid characters. Enter letters, numbers, quotes, hyphens, spaces or exclamation points.'
			},
		},
		id: {
			replace: {
				''	: /\s/g,
				'-'	: /^-+|-+$/g,
				'-'	: '!',
				'-'	: /-+/g	,
				''	: '"',
				''	: '\'',
				''	: /\(.*/,
			},
			regex: /[a-z][a-z0-9\-\s]{3,28}[a-z0-9]/ // 
		},
	});
	setupForm.find('.wpStateLess-combo-box.bucket .name').wppStatelessValidate({
		name: {
			empty:{
				break: true,
				regex: /.+/,
				errorMessage: 'Bucket name can\'t be empty.',
			},
			length:{
				regex: /^.{5,30}$/,
				errorMessage: 'Bucket name must be between 5 and 30 characters.',
				break: true
			},
			char:{
				regex: /^[a-z0-9][a-z0-9\-]*[a-z0-9]$/,
				errorMessage: 'A bucket name can contain lowercase alphanumeric characters, hyphens, and underscores. Bucket names must start and end with an alphanumeric character.',
			},
		},
	});
	setupForm.find('.wpStateLess-combo-box.billing-account .name').wppStatelessValidate({
		name: {
			empty:{
				break: true,
				regex: /.+/,
				errorMessage: 'Select a billing account.',
			},
		},
	});

	// Binding text input to create new in dropdown
	setupForm.find('.wpStateLess-combo-box').wpStatelessComboBox().find('.name').trigger('change');

	
	statelessWrapper.find('.learn-more').on('click', function(event){
		event.preventDefault();
		statelessWrapper.find('#wpStateLess-popup').addClass('active');
		return false;
	});

	// Check if authenticated with google then move to step 2.
	if(checkAuthentication()){

		// Load user profile. Ex Name, image, email address.
		wp.stateless.getProfile()
		  .done(function(profile){
			userInfo.find('img.user-photo').attr('src', profile.photo);
			userInfo.find('.user-name').html(profile.name);
			userInfo.find('.user-email').html(profile.email);
			userDetails.show();
		  });

		var projects = wp.stateless.listProjects()
		  .done(function(projects){
			projectDropdown.wpStatelessComboBox({items:projects});
		  });

		var billingAccounts = listBillingAccounts();

		jQuery.when(projects, billingAccounts).done(function function_name(projects, billingAccounts) {
			if((!projects || !projects.length) && (!billingAccounts || !billingAccounts.length)){
				setupForm.hide();
				jQuery('.wpStateLess-user-has-no-project-billing', statelessWrapper).show();
			}
		})
	}

	projectDropdown.on('change', function(event){
		event.stopPropagation();
		event.stopImmediatePropagation();
		var _this = jQuery(this);
		var projectId = _this.find('.id').val();
        
        if(typeof wp.stateless.projects[projectId] == 'undefined'){
			bucketDropdown.wpStatelessComboBox({items:{}});
		  	var name = billingDropdown.find('.name').val('');
		  	var id = billingDropdown.find('.id').val('');
		  	var account = name.wpStatelessComboBox({get: 0});

		  	console.log("account from ul list:", account);
		  	name.removeAttr('disabled');
		  	if(account){
				name.val(account.name +  " (" + account.id + ")");
				id.val(account.id);
		  	}
		  	return;
        }

		// Need to check if it's existing project.
		wp.stateless.listBucket(projectId)
		  .done(function(buckets){
		  	if(typeof wp.stateless.projects[projectId] != 'undefined'){
				bucketDropdown.find('.wpStateLess-existing h5').html(wp.stateless.projects[projectId].name + " Buckets").show();
		  	}
			bucketDropdown.wpStatelessComboBox({items:buckets});
		  }).fail(function(){
			bucketDropdown.wpStatelessComboBox({items:{}});
		  });

		//bucketDropdown.find('.name').val("stateless-" + projectId).trigger('change');

		wp.stateless.getServiceAccounts({projectId:projectId});

		wp.stateless.getProjectBillingInfo(projectId)
		  .done(function(billingInfo){
		  	var enabled = billingInfo.billingEnabled? "Active": "Inactive";
		  	billingDropdown.find('.name').removeAttr('disabled');
      		if(typeof billingInfo.id != 'undefined'){
      			var namID = billingInfo.id;
      			if(typeof billingInfo.name != 'undefined')
	      			namID = billingInfo.name + " (" + billingInfo.id + ")";

			  	billingDropdown.find('.id').val(billingInfo.id);
			  	billingDropdown.find('.name').val(namID).attr('disabled', 'disabled');
			}else{
			}
		  }).fail(function(responseData) {
		  	var name = billingDropdown.find('.name').val('');
		  	var id = billingDropdown.find('.id').val('');
		  	var account = name.wpStatelessComboBox({get: 0});

		  	console.log("account from ul list:", account);
		  	name.removeAttr('disabled');
		  	if(account){
				name.val(account.name +  " (" + account.id + ")");
				id.val(account.id);
		  	}

		  });
	});

	jQuery(document).on('tokenExpired', function(){
		checkAuthentication({triggerEvent: false});
	});

	userInfo.on('click', '.logout', function(e){
		var loginButton = jQuery('#google-login');
		var loginUrl = loginButton.attr('href');
		loginButton.attr('href', loginUrl + "&force_login=true");
		e.preventDefault();
		wp.stateless.clearAccessToken();
		checkAuthentication();
	});

	statelessWrapper.on('click', '.create-billing-account', function(event) {
		event.preventDefault();
		var xhr;
		var counter = 5;
		var interval = 200;
		var _this = jQuery(this)
		var href = _this.attr('href');
		var new_window = window.open(href,'_newtab');

		var loader = _this.find('.wpStateLess-loading');
		loader.addClass('active');
		var checkBillingAccount = function(force) {
			counter ++;
			if(force === true || new_window.closed == true || counter % 35 == 0){
				if(new_window.closed == true){
					clearInterval(billingChecker);
					loader.removeClass('active');
				}
				
				if(xhr && typeof xhr.abort != 'undefined'){
					xhr.abort();
				}

				xhr = listBillingAccounts().done(function(accounts) {
					if(accounts && accounts.length){
						jQuery('.wpStateLess-user-has-no-project-billing', statelessWrapper).hide();
						setupForm.show();
						clearInterval(billingChecker);
						loader.removeClass('active');
						jQuery(window).off( 'focus', checkBillingAccount)
					}
				});
			}
		}
		var billingChecker = setInterval(checkBillingAccount, interval);
		
		jQuery(window).focus( checkBillingAccount.bind(null, true));

		return false;
	})

	setupForm.find('.get-json-key').on('click', function(event){
		event.preventDefault();
		var projectId = projectDropdown.find('.id').val();
		var projectName = projectDropdown.find('.name').val().replace(/\(.*/, '').replace(/^\s+|\s+$/g,'');
		var bucketName = bucketDropdown.find('.name').val();
		var bucketId = bucketName;
		var serviceAccountId = 'stateless-' + bucketId.replace('stateless-', '');
		var serviceAccountName = 'Stateless ' + bucketName.replace('Stateless', '');
		var billingAccount = billingDropdown.find('.id').val();
		var isValid = true;

		if(!projectId || !projectName || !bucketId || !billingAccount){ // No valid project id
			isValid = false;
			console.log("Form:: Input not valid.")
			return;
		}

		jQuery(this).find('.wpStateLess-loading').addClass('active');


		// Checking if user want to create new project.
		if(!wp.stateless.projects[projectId]){
			wp.stateless.createProject({"projectId": projectId, "name": projectName}).done(function(argument) {
				_updateProjectBillingInfo();
			}).fail(function(response) {
				response = response.responseJSON;
				console.log(response);
				if(response && typeof response.error != 'undefined' && typeof response.error.status != 'undefined' && response.error.status == 'ALREADY_EXISTS'){
					_updateProjectBillingInfo();
				}
			});
		}else{
			_updateProjectBillingInfo();
		}

		function _updateProjectBillingInfo(){
			if( typeof wp.stateless.projects[projectId] == 'undefined' || typeof wp.stateless.projects[projectId]['billingInfo'] == 'undefined'){
				wp.stateless.updateProjectBillingInfo({"projectID": projectId, "accountName": billingAccount}).done(function(argument) {
					_createBucket();
				});
			}
			else{
				_createBucket();
			}
		}

		function _createBucket(){
			if( typeof wp.stateless.projects[projectId] == 'undefined' || typeof wp.stateless.projects[projectId]['buckets'][bucketId] == 'undefined'){
				wp.stateless.createBucket({"projectId": projectId, "name": bucketId}).done(function(argument) {
					_createServiceAccount();
				}).fail(function(response) {
					response = response.responseJSON;
					console.log(response);
					if(response && typeof response.error != 'undefined' && typeof response.error.code != 'undefined' && response.error.code == 409){
						_createServiceAccount();
					}
				});
			}
			else{
				_createServiceAccount();
			}
		};

		function _createServiceAccount(){
			console.log("wp::stateless::bucketCreated");
			if( typeof wp.stateless.projects[projectId] != 'undefined' && typeof wp.stateless.projects[projectId]['serviceAccounts'] != 'undefined'){
				var serviceAccounts = wp.stateless.projects[projectId]['serviceAccounts'];
				var accountFound = false;
				jQuery.each(serviceAccounts, function(index, item) {
					if(item.displayName == bucketName || item.email.replace(/@.*/, '') == serviceAccountId){
						_insertBucketAccessControls(item.email);
						accountFound = true;
						return false;
					}
				})
			}

			if(accountFound) return;


			wp.stateless.createServiceAccount({
				'projectId': projectId,
				'accountId': serviceAccountId,
				'name': serviceAccountName,
			}).done(function(createdSerciceAccount){
				_insertBucketAccessControls(createdSerciceAccount.email);
			}).fail(function(response) {
				alert("Something wrong."); // Remove
			});
		};

		function _insertBucketAccessControls(createdSerciceAccountEmail) {
			wp.stateless.insertBucketAccessControls({
				"bucket": bucketId,
				"user": createdSerciceAccountEmail
			}).done(function(responseData){
				console.log("Bucket Access Control inserted", responseData);
				_createServiceAccountKeys(responseData.email);
				
			});
		}

		function _createServiceAccountKeys(createdSerciceAccountEmail) {
			wp.stateless.createServiceAccountKeys({
				"project": projectId,
				"account": createdSerciceAccountEmail
			}).done(function(ServiceAccountKey){
				jQuery.ajax({
					url: ajaxurl,
					method: "POST",
					headers: {
						"content-type": "application/x-www-form-urlencoded",
					},
					data: {//JSON.stringify({
						'action': 'stateless_wizard_update_settings',
						'bucket': bucketId,
						'privateKeyData': ServiceAccountKey.privateKeyData,
					}//)
				}).done(function(response) {
					if(typeof response.success != undefined && response.success == true){
						console.log("Option updated");

						// We have access token.
						setupStepsBars.find('li')
							.removeClass('wpStateLess-done active')
							.filter('.step-google-login, .step-setup-project')
							.addClass('wpStateLess-done');
						setupSteps.removeClass('active')
							.filter('.step-final')
							.addClass('active');
					}
				});

				jQuery(this).find('.wpStateLess-loading').removeClass('active');
			});
		}
		
		return false;
	});
	var resizeId;
	var repositionLogoutButton = function(e) {
		if(jQuery(window).width() && jQuery(window).width() < 767){
			userDetails.append(userInfo.find('h4 .logout'));
		}
		else{
			userDetails.find('h4').append(userDetails.find('> .logout'));
		}
	};

	repositionLogoutButton();

	jQuery(window).on('orientationchange', repositionLogoutButton);
	jQuery(window).on('resize', function(e) {
		clearTimeout(resizeId);
		resizeId = setTimeout(repositionLogoutButton, 400);
	} );

});