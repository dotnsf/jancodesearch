exports.amazon_affiliate = '';
exports.rakuten_affiliate = '';
exports.yahoo_affiliate = '';
exports.omniseven_affiliate = '';
exports.pa_affiliate = '';
exports.dmm_affiliate = '';


if( process.env.VCAP_SERVICES ){
  var VCAP_SERVICES = JSON.parse( process.env.VCAP_SERVICES );
  if( VCAP_SERVICES && VCAP_SERVICES.cloudantNoSQLDB ){
    exports.db_username = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.username;
    exports.db_password = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.password;
  }
}
