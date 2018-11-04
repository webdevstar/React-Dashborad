import {SERVICES} from '../services/services';

const constants = {
           SENTIMENT_JSON_MAPPING : {
                "0": -5,
                "-1": -15,
                "1": 5
           },
           TIMESPAN_TYPES : {
                'hours': {
                    format: "MM/DD/YYYY HH:00", blobFormat: "[hour]-YYYY-MM-DDHH:00", rangeFormat: "hour"
                },
                'days': {
                    format: "MM/DD/YYYY", blobFormat: "[day]-YYYY-MM-DD", rangeFormat: "day"
                },
                'months': {
                    format: "YYYY-MM", blobFormat: "[month]-YYYY-MM", rangeFormat: "month"
                },
                'weeks': {
                    format: "YYYY-WW", blobFormat: "[week]-YYYY-WW", rangeFormat: "isoweek"
                },
                'customDate': {
                    format: "MM/DD/YYYY", reactWidgetFormat: "MMM Do YYYY", blobFormat: "[day]-YYYY-MM-DD", rangeFormat: "day"
                },
                'customDateTime': {
                    format: "MM/DD/YY HH:00", reactWidgetFormat: "MMM Do YYYY HH:00", blobFormat: "[hour]-YYYY-MM-DDHH:00", rangeFormat: "hour"
                },
                'customMonth': {
                    format: "MMMM YYYY", reactWidgetFormat: "MMMM YYYY", blobFormat: "[month]-YYYY-MM", rangeFormat: "month"
                }
           },
           DATA_SOURCES: new Map([["all", {"display": "All", "sourceValues":[], "icon": "fa fa-share-alt", "label": "All"}], 
                            ["facebook", {"display": "Facebook", "sourceValues":["facebook-messages", "facebook-comments"], "icon": "fa fa-facebook-official", "label": ""}], 
                            ["twitter", {"display": "Twitter", "sourceValues":["twitter"], "label": "", "icon": "fa fa-twitter"}], 
                            ["acled", {"display": "acled", "sourceValues":["acled"], "label": "", "icon": "fa fa-font"}],
                            ["tadaweb", {"display": "Tadaweb", "sourceValues":["tadaweb"], "label": "", "icon": "fa fa-text-width"}]
                          ]),
           MOMENT_FORMATS: {
               "timeScaleDate": "MM/DD/YY HH:00"
           },
           SENTIMENT_COLOR_MAPPING : {
               "negative": "red",
               "neutral": "yellow",
               "positive": "green"
           },
           EVENT_SOURCE_ICON_MAP : {
               "twitter": "fa fa-twitter",
               "facebook": "fa fa-facebook-official"
           },
           CATEGORY_KEY_MAPPING: {
             'kw': 'keyword',
             'g': 'group',
             'sec': 'sector',
             'st': 'status'
           },
           DASHBOARD : {
               CHANGE_SEARCH: "SEARCH:CHANGE",
               CHANGE_DATE: "DATE:CHANGE",
               INITIALIZE: "INIT",
               CHANGE_SOURCE: "UPDATE:DATA_SOURCE",
               CHANGE_COLOR_MAP: "UPDATE:COLOR_MAP",               
               ASSOCIATED_TERMS: "UPDATE:ASSOCIATED_TERMS",
               CHANGE_TERM_FILTERS: "UPDATE:CHANGE_TERM_FILTERS",
               CHANGE_LANGUAGE: "DASHBOARD:CHANGE_LANGUAGE"
           },
           FACTS : {
               LOAD_FACTS_SUCCESS: "LOAD:FACTS_SUCCESS",
               LOAD_FACTS_FAIL: "LOAD:FACTS_FAIL",
               INITIALIZE: "INIT",
               SAVE_PAGE_STATE: "SAVE:PAGE_STATE",
               LOAD_FACT: "LOAD:FACT",
               CHANGE_LANGUAGE: "FACTS:CHANGE_LANGUAGE",
               LOAD_FACT_TAGS: "LOAD:FACT_TAGS"
           },
           ADMIN : {
               LOAD_KEYWORDS: "LOAD:KEYWORDS",
               LOAD_SETTINGS: "LOAD:SETTINGS",
               SAVE_SETTINGS: "SAVE:SETTINGS",
               CREATE_SITE: "CREATE:SITE",
               SAVE_TWITTER_ACCTS: "SAVE:TWITTER_ACCTS",
               LOAD_TWITTER_ACCTS: "LOAD:TWITTER_ACCTS",
               LOAD_FB_PAGES: "LOAD:FB_PAGES",
               LOAD_LOCALITIES: "LOAD:LOCALITIES",
               GET_LANGUAGE: "GET:LANGUAGE",
               GET_TARGET_REGION: "GET:TARGET_REGION",
               LOAD_FAIL: "LOAD:FAIL",
           },
};

const DataSources = source => constants.DATA_SOURCES.has(source) ? constants.DATA_SOURCES.get(source).sourceValues : undefined;
const DataSourceLookup = requestedSource => {
    // eslint-disable-next-line
    for (let [source, value] of constants.DATA_SOURCES.entries()) {
        if(value.sourceValues.indexOf(requestedSource) > -1){
            return value;
        }
    }

    return undefined;
};

const methods = {
    DASHBOARD: {
        changeSearchFilter(selectedEntity, siteKey, colorMap){
           let self = this;
           self.dispatch(constants.DASHBOARD.CHANGE_SEARCH, {selectedEntity, colorMap});
        },
        initializeDashboard(siteId) {
            let self = this;

            SERVICES.getSiteDefintion(siteId, false, (response, error) => {
                if (response) {
                    let siteSettings = response.siteDefinition.sites[0];
                    let languages = siteSettings.properties.supportedLanguages;
                    SERVICES.fetchEdges(siteId, languages, "All", (edges, error) => {
                        if (edges){
                            let edgesDictionary = {};
                            edges.terms.edges.concat(edges.locations.edges).forEach(edgeObject => {
                                let wordByLanguageMap = {};
                                languages.forEach(language => {
                                    if(language == 'en'){
                                        wordByLanguageMap[language] = edgeObject['name'];
                                    }
                                    else{
                                        wordByLanguageMap[language] = edgeObject['name_' + language] || edgeObject[language+'_name'];
                                    }
                                })
                                edgesDictionary[edgeObject.name.toLowerCase()] = wordByLanguageMap;
                            })
                            siteSettings.properties.edgesByLanguages = edgesDictionary;
                            
                            siteSettings.properties.edges = edges.terms.edges.concat(edges.locations.edges).map(edge => {
                                languages.forEach(language => {
                                    if (edge[language + '_name']) {
                                        edge['name_' + language] = edge[language + '_name'];
                                    }
                                });
                                edge["name_en"] = edge["name"];
                                return edge;
                            });
                            console.log("siteSettings", siteSettings);
                            self.dispatch(constants.DASHBOARD.INITIALIZE, siteSettings);
                        }
                        else {
                            console.error(`[${error}] occured while fetching edges`);
                        }
                    });

                } else {
                    console.error(`[${error}] occured while processing message request`);
                }
            });
        },
   
        termsColorMap(colorMap){
            this.dispatch(constants.DASHBOARD.CHANGE_COLOR_MAP, {colorMap})
        },
        changeTermsFilter(newFilters){
           this.dispatch(constants.DASHBOARD.CHANGE_TERM_FILTERS, newFilters);
        },
        filterDataSource(dataSource){
           this.dispatch(constants.DASHBOARD.CHANGE_SOURCE, dataSource);
        },
        updateAssociatedTerms(associatedKeywords, bbox){
            this.dispatch(constants.DASHBOARD.ASSOCIATED_TERMS, {associatedKeywords, bbox});
        },
        changeDate(siteKey, datetimeSelection, timespanType){
           this.dispatch(constants.DASHBOARD.CHANGE_DATE, {datetimeSelection: datetimeSelection, timespanType: timespanType});
        },
        changeLanguage(language){
           this.dispatch(constants.DASHBOARD.CHANGE_LANGUAGE, language);
           this.dispatch(constants.FACTS.CHANGE_LANGUAGE, language);
        }
    },
    FACTS: {
        load_facts: function (pageSize, skip, tagFilterArray = []) {
            let self = this;
            SERVICES.getFactsWithFilter(pageSize, skip, tagFilterArray)
                .subscribe(response => {
                    self.dispatch(constants.FACTS.LOAD_FACTS_SUCCESS, { response: response });
                }, error => {
                    console.warn('Error, could not load facts', error);
                    self.dispatch(constants.FACTS.LOAD_FACTS_FAIL, { error: error });
                });
        },
        load_fact_tags: function () {
            let self = this;
            SERVICES.getFactTags().subscribe(response => {
                self.dispatch(constants.FACTS.LOAD_FACT_TAGS, { response: response });
            });
        },
        load_settings: function(siteName){
            let self = this;
            const LOAD_SITE_LIST = true;

            SERVICES.getSiteDefintion(siteName, false, (response, error) => {
                if (response) {
                    self.dispatch(constants.FACTS.INITIALIZE, response.siteDefinition.sites[0]);
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
            });
        },
        save_page_state: function (pageState) {
            this.dispatch(constants.FACTS.SAVE_PAGE_STATE, pageState);
        },
        load_fact: function (id) {
            let self = this;
            SERVICES.getFact(id)
                    .subscribe(response => {
                        self.dispatch(constants.FACTS.LOAD_FACT, { response: response });
                    }, error => {
                        console.warning('Error, could not load fact id: ' + id, error);
                    });
        }
    },
    ADMIN: {
        load_settings: function(siteName){
            let self = this;
            const LOAD_SITE_LIST = true;

            SERVICES.getSiteDefintion(siteName, LOAD_SITE_LIST, (response, error) => {
                    if(response) {
                        if(response.siteDefinition.sites.length > 0){
                            const action = false;
                            self.dispatch(constants.ADMIN.LOAD_SETTINGS, {settings: response.siteDefinition.sites[0], 
                                                                          action: action, 
                                                                          originalSiteName: siteName, 
                                                                          siteList: response.siteList.sites});
                        }else{
                            console.error(`site [${siteName}] does not exist.`);
                        }
                    }else{
                        console.error(`[${error}] occured while processing message request`);
                    }
            });
        },
        save_settings: function(siteName, modifiedSettings){
            let self = this;

            SERVICES.createOrReplaceSite(siteName, modifiedSettings, (error, response, body) => {
                if(!error && response.statusCode === 200 && body.data && body.data.createOrReplaceSite) {
                    const action = 'Saved';
                    let mutatedSettings = Object.assign({}, {name: modifiedSettings.name}, {properties: modifiedSettings});
                    delete mutatedSettings.properties.name;

                    self.dispatch(constants.ADMIN.LOAD_SETTINGS, {settings: mutatedSettings, 
                                                                  originalSiteName: siteName, 
                                                                  action: action});
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
            });
        },
        create_site: function(siteName, modifiedSettings){
            let self = this;

            SERVICES.createOrReplaceSite(siteName, modifiedSettings, (error, response, body) => {
                if(!error && response.statusCode === 200 && body.data && body.data.createOrReplaceSite) {
                    const action = 'Saved';
                    self.dispatch(constants.ADMIN.CREATE_SITE, {siteName, action});
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
            });
        },
        save_twitter_accts: function(siteName, twitterAccts){
            let self = this;
            const mutationNameTwitterAcctModify = "modifyTwitterAccounts";

            SERVICES.saveTwitterAccounts(siteName, twitterAccts, mutationNameTwitterAcctModify, (error, response, body) => {
                if(!error && response.statusCode === 200 && body.data && body.data.streams) {
                    const action = 'saved';
                    const streams = body.data.streams;
                    self.dispatch(constants.ADMIN.LOAD_TWITTER_ACCTS, {streams, action});
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
           });
        },
        remove_twitter_accts: function(siteName, twitterAccts){
            let self = this;
            const mutationNameTwitterAcctModifyRemove = "removeTwitterAccounts";
            SERVICES.saveTwitterAccounts(siteName, twitterAccts, mutationNameTwitterAcctModifyRemove, (error, response, body) => {
                if(!error && response.statusCode === 200 && body.data && body.data.streams) {
                    const action = 'saved';
                    const streams = body.data.streams;
                    self.dispatch(constants.ADMIN.LOAD_TWITTER_ACCTS, {streams, action});
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
           });
        },
        load_twitter_accts: function (siteId) {
            let self = this;
            SERVICES.getTwitterAccounts(siteId, (error, response, body) => {
                        if (!error && response.statusCode === 200) {
                            const streams = body.data.streams;
                            let action = false;
                            self.dispatch(constants.ADMIN.LOAD_TWITTER_ACCTS, {streams, action});
                        }else{
                            let error = 'Error, could not load twitter accts for admin page';
                            self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
                        }
            });
        },
        load_keywords: function (siteId, languages) {
            let self = this;
            const edgeType = "Term";
            let dataStore = this.flux.stores.AdminStore.dataStore;
            if (!dataStore.loading) {
                SERVICES.fetchEdges(siteId,languages, edgeType, (result,error) => {   
                    if(result){            
                        let action = false;
                        self.dispatch(constants.ADMIN.LOAD_KEYWORDS, {result, action});
                    }
                    else{
                        self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
                    }
                })
            }
        },
        remove_keywords: function(siteId, deletedRows){
            let self = this;

            SERVICES.removeKeywords(siteId, deletedRows, (error, response, body) => {
                if(!error && response.statusCode === 200 && body.data.removeKeywords) {
                    const response = body.data.removeKeywords.edges;
                    const action = 'removed';
                    self.dispatch(constants.ADMIN.LOAD_KEYWORDS, {response, action});
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
            });
        },
        save_keywords: function(siteId, modifiedKeywords){
            let self = this;
            SERVICES.saveKeywords(siteId, modifiedKeywords, (error, response, body) => {
                if(!error && response.statusCode === 200) {
                    const action = 'saved';
                    const response = body.data.addKeywords.edges;
                    self.dispatch(constants.ADMIN.LOAD_KEYWORDS, {response, action});
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
            });
        },
        save_locations: function(siteId, modifiedKeywords){
            let self = this;
            SERVICES.saveLocations(siteId, modifiedKeywords, (error, response, body) => {
                if(!error && response.statusCode === 200) {
                    const action = 'saved';
                    const response = body.data.saveLocations.edges;
                    self.dispatch(constants.ADMIN.LOAD_LOCALITIES, {response, action});
                }else{
                    console.error(`[${error}] occured while processing save locations request`);
                }
            });
        },
        remove_locations: function(siteId, modifiedLocations){
            let self = this;
            SERVICES.removeLocations(siteId, modifiedLocations, (error, response, body) => {
                if(!error && response.statusCode === 200) {
                    const action = 'saved';
                    const response = body.data.removeLocations.edges;
                    self.dispatch(constants.ADMIN.LOAD_LOCALITIES, {response, action});
                }else{
                    console.error(`[${error}] occured while processing save locations request`);
                }
            });
        },
        load_localities: function (siteId) {
            let self = this;
            const edgeType = "Location";
            SERVICES.fetchEdges(siteId, "en", edgeType, (error, response, body) => {
                        if (!error && response.statusCode === 200) {
                            const action = false;
                            const response = body.data.locations.edges;
                            self.dispatch(constants.ADMIN.LOAD_LOCALITIES, {response, action});
                        }else{
                            let error = 'Error, could not load keywords for admin page';
                            self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
                        }
            });
        },

        load_fb_pages: function () {
            let self = this;
            let dataStore = this.flux.stores.AdminStore.dataStore;
            if (!dataStore.loading) {
                SERVICES.getAdminFbPages()
                    .subscribe(response => {
                        self.dispatch(constants.ADMIN.LOAD_FB_PAGES, { fbPages: response });
                    }, error => {
                        console.warning('Error, could not load facts', error);
                        self.dispatch(constants.ADMIN.LOAD_FAIL, { error: error });
                    });
            }
        },

         get_language: function () {
            let self = this;
            let dataStore = this.flux.stores.AdminStore.dataStore;
            if (!dataStore.loading) {
                SERVICES.getAdminLanguage()
                    .subscribe(response => {
                        self.dispatch(constants.ADMIN.GET_LANGUAGE, { language: response });
                    }, error => {
                        console.warning('Error, could not load facts', error);
                        self.dispatch(constants.FACTS.LOAD_FAIL, { error: error });
                    });
            }
        },

        get_target_region: function () {
            let self = this;
            let dataStore = this.flux.stores.AdminStore.dataStore;
            if (!dataStore.loading) {
                SERVICES.getAdminTargetRegion()
                    .subscribe(response => {
                        self.dispatch(constants.ADMIN.GET_TARGET_REGION, { targetRegion: response });
                    }, error => {
                        console.warning('Error, could not load facts', error);
                        self.dispatch(constants.ADMIN.LOAD_FAIL, { error: error });
                    });
            }
        }
    }
};

export const Actions = {
  constants: constants,
  methods: methods,
  DataSources: DataSources,
  DataSourceLookup
};
