//. api.js

var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    client = require( 'cheerio-httpcli' ),
    fs = require( 'fs' ),
    cloudantlib = require( '@cloudant/cloudant' ),
    router = express.Router();
var settings = require( '../settings' );


router.use( bodyParser.urlencoded( { extended: true } ) );
router.use( bodyParser.json() );

client.set( 'browser', 'chrome' );
client.set( 'referer', false );

//. 何かが入っていればいい？
var rakuten_cookie = 'abc'; //Rp=e58895593222713339338d615d00b8c758b1c438343da; cto_lwid=6aff9334-475e-49e7-b030-f7af03e2aea2; __gads=ID=c29f3f6fae7cdbfe:T=1563062313:S=ALNI_Mbp8Z_hRjJlLq55nbWh9tOzODaYRA; tg_af_histid=h686973745f6964r3331363333353634333433303334363133363331333033303330333033333332326536313633363633373330363336363336; Rt=8e00ac818d867608037f5a8c0eac0533; __pp_uid=kMtoFHyjZl4kJPT4ubhLMRxRvyNrW4An; Rq=5d647e8d; utag_main=v_id:016cd08d55ad008763ac54b627b003073011006b007e8$_sn:2$_ss:1$_st:1566898914187$ses_id:1566897114187%3Bexp-session$_pn:1%3Bexp-session; _ra=1574064393827|8c9283ec-3c29-4359-aaa8-65cde604e83e; _fbp=fb.2.1576114514938.33368137; _mkto_trk=id:673-CVK-590&token:_mch-rakuten.co.jp-1578399865565-96950; _ebtd=2.h0gg146db1.1560226325; LPVID=A4OWUyZGZkZmM0NmJmYzgw; LPSID-7149717=VXAqk2iRQ4qriWwsp31brQ; s_sess=%20s_cc%3Dtrue%3B%20scctq%3D1%3B%20s_prevsite%3Dbroadband%3B%20s_sq%3D%3B; _adp_uid=MQCX-QCeZgFR4m-QTgMD5iAmQwwqj_B0; s_pers=%20s_xsent%3D1911%7C1731744392932%3B%20s_mrcr%3D1100400000000000%257C4000000000000%257C4000000000000%257C4000000000000%7C1737434312772%3B; Re=18.21.0.0.0.101785.1:22.12.4.3.0.501125.2:16.9.2.3.0.566677.1:30.5.1.0.0.210677.1-18.21.0.0.0.101785.1:22.12.4.3.0.501125.2:16.9.2.3.0.566677.1:30.5.1.0.0.210677.1; ProductSC=1; rat_v=9d6cba9e23b4e8926c5c7915005e2fa48e102ab; ak_bmsc=31ED132A69F5FE6BACD989BBEA4BE020172A9C9EC22F00008CA42F5EA9BF6769~plPumJD8LE9yHS5/pkRYlRFi3oVPS3qL6JK2nqi1uav74ZfswMuO7/OPJd+YadtB5K5aztx3AJfg8lGW85vdY5WBZvqw7tSUaiyFb6bqA079EwjAOw+9nTdAI9sJYa3BeNyAISwb6sl1UZo3IBkPqDW9WhGvc1tbjRjr38h3+i6gkjPsWly8o+4nJoV7PUxle8RHlOiGyvjPUSjp05HAdShPKNxkmQw42jp3mV0dP7U6e9rPpw4lHyld8VuZU7ogky; bm_sv=B686DC3460310B471CBAA16CAF90E56D~B+6jCTBgzAZCZnlzR1wOlrYF36dSxrx5rku3FJTXjTXPnRyucI0G84AU2hP2kumYtCDxW3aSum1Fy2i7u7ziisnEQZLLBXeljnm+eOl//jGXM5zSvD5xQFls58kpWVBOKedwfM+BJWeBcYMSjdJOLsRDu6sYehovpilY9P7ebwI=';

var categories = {};
var infos = {};
getCategories().then( function( result ){
  categories = JSON.parse( JSON.stringify( result ) );

  getBasicInfo( categories ).then( function( result ){
    //images_and_names = JSON.parse( JSON.stringify( infos ) );
    //console.log( images_and_names );
  });
});


router.get( '/dragstore/categories', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  res.write( JSON.stringify( { status: true, categories: categories }, null, 2 ) );
  res.end();
});

router.get( '/dragstore/infos', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  res.write( JSON.stringify( { status: true, infos: infos }, null, 2 ) );
  res.end();
});

router.get( '/dragstore/category/:name', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var name = req.params.name;
  if( name ){
    var url = null;
    Object.keys( categories ).forEach( function( key ){
      var objs = categories[key];
      //console.log( objs );
      objs.forEach( function( obj ){
        if( obj.name == name ){
          url = obj.url;
        }
      });
    });

    if( url ){
      res.write( JSON.stringify( { status: true, url: url }, null, 2 ) );
      res.end();
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'no category found.' }, null, 2 ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'no name specified.' }, null, 2 ) );
    res.end();
  }
});

router.get( '/dragstore/items/:categoryname', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var categoryname = req.params.categoryname;
  if( categoryname ){
    var url = null;
    Object.keys( categories ).forEach( function( key ){
      var objs = categories[key];
      //console.log( objs );
      objs.forEach( function( obj ){
        if( obj.name == categoryname ){
          url = obj.url;
        }
      });
    });

    if( url ){
      getCodes( url ).then( function( result ){
        if( result ){
          var items = [];
          for( var i = 0; i < result.ranks.length; i ++ ){
            var code = result.codes[i];
            if( code != "－" ){
              var rank = result.ranks[i];
              var maker = result.makers[i];
              var name = result.names[i];
              var avg_price = result.avg_prices[i];

              var item = {
                rank: rank,
                maker: maker,
                name: name,
                avg_price: avg_price,
                code: code
              };
              items.push( item );
            }
          }

          var p = JSON.stringify( { status: true, items: items }, null, 2 );
          res.write( p );
          res.end();
        }else{
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: 'no codes found.' }, null, 2 ) );
          res.end();
        }
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'no category found.' }, null, 2 ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'no categoryname specified.' }, null, 2 ) );
    res.end();
  }
});

router.get( '/shop/:shop/:code', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var shop = req.params.shop;
  var code = req.params.code;
  if( shop && code ){
    var sites = {
      amazon: 'https://www.amazon.co.jp/s/ref=nb_sb_noss?field-keywords=' + code + '&sort=price-asc-rank',
      bookoff: 'http://www.bookoffonline.co.jp/display/L001,q=' + code, // 要Referer?
      dmm: 'http://www.dmm.com/search/=/searchstr=' + code,
      google: 'https://www.google.co.jp/search?q=' + code + '&tbm=shop&tbs=p_ord:p',
      kakaku: 'http://kakaku.com/search_results/' + code + '/?act=Sort&sort=priceb',
      //kenko: 'https://www.kenko.com/prod_search/' + code + '/',   // JANコード検索不対応
      matsukiyo: 'http://www.e-matsukiyo.com/shop/goods/search.aspx#q=' + code + '&sort=price asc',   // サーバー移転？
      omniseven: 'https://www.omni7.jp/search/?keyword=' + code + '&searchKeywordFlg=1&sort=low',
      playasia: 'http://www.play-asia.com/search/' + code,
      rakuten: 'https://product.rakuten.co.jp/search/?s=4&v=table&st=1&q=' + code,  // レスポンスが悪すぎる。他は遅くても２秒程度なのに、ここだけ１０秒位　要Referer?要Cookie?
      sofmap: 'https://www.sofmap.com/search_result.aspx?keyword=' + code + '&product_type=ALL&order_by=PRICE_ASC',
      yahoo: 'https://shopping.yahoo.co.jp/search?p=' + code + '&X=2&sc_i=shp_pc_search_sort_sortitem'
      //yamada: 'https://www.yamada-denkiweb.com/search/' + code + '/?sort=price'  // JANコード検索不対応
    };

    var url = sites[shop];
    var encode = 'UTF-8';
    if( url.indexOf( 'kakaku' ) > -1 || url.indexOf( 'sofmap' ) > -1 ){
      encode = 'shift_jis';
    }

    var ts0 = ( new Date() ).getTime();
    getHTML( url, encode, shop ).then( function( body ){
      var ts1 = ( new Date() ).getTime();
      var ms = ts1 - ts0;
      var p = JSON.stringify( { status: true, shop: shop, code: code, ms: ms, result: body }, null, 2 );
      res.write( p );
      res.end();
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'no code specified.' }, null, 2 ) );
    res.end();
  }
});

router.get( '/code/:code', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var code = req.params.code;
  if( code ){
    var sites = {
      amazon: 'https://www.amazon.co.jp/s/ref=nb_sb_noss?field-keywords=' + code + '&sort=price-asc-rank',
      //bookoff: 'http://www.bookoffonline.co.jp/display/L001,q=' + code, // 要Referer?
      dmm: 'http://www.dmm.com/search/=/searchstr=' + code,
      google: 'https://www.google.co.jp/search?q=' + code + '&tbm=shop&tbs=p_ord:p',
      kakaku: 'http://kakaku.com/search_results/' + code + '/?act=Sort&sort=priceb',
      //kenko: 'https://www.kenko.com/prod_search/' + code + '/',   // JANコード検索不対応
      //matsukiyo: 'http://www.e-matsukiyo.com/shop/goods/search.aspx#q=' + code + '&sort=price asc',   // サーバー移転？
      omniseven: 'https://www.omni7.jp/search/?keyword=' + code + '&searchKeywordFlg=1&sort=low',
      playasia: 'http://www.play-asia.com/search/' + code,
      rakuten: 'https://product.rakuten.co.jp/search/?s=4&v=table&st=1&q=' + code,  // cookie がないとレスポンスが悪すぎる。他は遅くても２秒程度なのに、ここだけ１０秒位　要Referer?要Cookie?
      sofmap: 'https://www.sofmap.com/search_result.aspx?keyword=' + code + '&product_type=ALL&order_by=PRICE_ASC',
      yahoo: 'https://shopping.yahoo.co.jp/search?p=' + code + '&X=2&sc_i=shp_pc_search_sort_sortitem'
      //yamada: 'https://www.yamada-denkiweb.com/search/' + code + '/?sort=price'  // JANコード検索不対応
    };

    var shops_num = 0;
    for( shop in sites ){
      shops_num ++;
    }

    var cnt = 0;
    var result = [];
    for( shop in sites ){
      var url = sites[shop];
      var encode = 'UTF-8';
      if( url.indexOf( 'kakaku' ) > -1 || url.indexOf( 'sofmap' ) > -1 ){
        encode = 'shift_jis';
      }

      getHTML( url, encode, shop ).then( function( body ){
        if( body && body.price > 0 ){
          result.push( body );
        }

        cnt ++;
        if( cnt == shops_num ){
          var p = JSON.stringify( { status: true, code: code, result: result }, null, 2 );
          res.write( p );
          res.end();
        }
      });
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'no code specified.' }, null, 2 ) );
    res.end();
  }
});

router.get( '/xframe', function( req, res ){
  var url = req.query.url;
  var tmp = url.split( '/' ); //. https://basehost/xxx
  var basehost = tmp[2];
  var encode = 'UTF-8';
  if( url.indexOf( 'kakaku' ) > -1 || url.indexOf( 'sofmap' ) > -1 ){
    encode = 'shift_jis';
  }
  client.fetch( url, {}, encode, function( err, $, res0, body ){
    if( err ){
      res.contentType( 'application/json; charset=utf-8' );
      res.status( 400 );
      res.write( JSON.stringify( err ) );
      res.end();
    }else{
      res.contentType( 'text/html; charset=UTF-8' );
      body = body.split( '<head>' ).join( '<head><base href="//' + basehost + '">' );
      body = body.split( 'charset=shift_jis' ).join( 'charset=UTF-8' );
      body = body.split( '</html>' ).join( '<script>document.onclick=function(e){return false;};document.onmouseup=function(e){return false;};</script></html>' );

      res.write( body );
      res.end();
    }
  });
});

router.get( '/categories', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  res.write( JSON.stringify( categories ) );
  res.end();
});


function getCategories(){
  return new Promise( function( resolve, reject ){
    var url = 'https://www2.fgn.jp/mpac/list/?t=3';
    client.fetch( url, {}, "UTF-8", function( err, $, res, body ){
      if( err ){
        resolve( null );
      }else{
        var categories = {};
        var cat_name = '';
        $('table.main tr td.title02 a').each( function(){
          var href = $(this).attr( 'href' );
          var text = $(this).text();
          var colspan = $(this).parent().attr( 'colspan' );
          if( !colspan ){
            var rowspan = $(this).parent().attr( 'rowspan' );
            if( rowspan ){
              //. 大カテゴリ
              categories[text] = [];
              cat_name = text;
            }else{
              //. 小カテゴリ
              var category = { name: text, url: 'https://www2.fgn.jp' + href };
              categories[cat_name].push( category );
            }
          }
        });
        resolve( categories );
      }
    });
  });
}

async function getCodes( category_url ){
  return new Promise( function( resolve, reject ){
    client.fetch( category_url, {}, "UTF-8", function( err, $, res, body ){
      if( err ){
        resolve( null );
      }else{
        var ranks = [];
        var makers = [];
        var names = [];
        var avg_prices = [];
        var codes = [];
        $('table.pos_rank tr[bgcolor] td:nth-child(1)').each( function(){
          var rank = $(this).text();
          ranks.push( parseInt( rank ) );
        });
        $('table.pos_rank tr[bgcolor] td:nth-child(2)').each( function(){
          var maker = $(this).text();
          makers.push( maker );
        });
        $('table.pos_rank tr[bgcolor] td:nth-child(3)').each( function(){
          var name = $(this).text();
          names.push( name );
        });
        $('table.pos_rank tr[bgcolor] td:nth-child(4)').each( function(){
          var avg_price = $(this).text();
          avg_prices.push( parseInt( avg_price ) );
        });
        $('table.pos_rank tr[bgcolor] td:nth-child(9)').each( function(){
          var code = $(this).text();
          codes.push( code );
        });

        resolve( { ranks: ranks, makers: makers, names: names, avg_prices: avg_prices, codes: codes } );
      }
    });
  });
}

function getHTML( url, encode, shop ){
  return new Promise( function( resolve, reject ){
    var ts0 = ( new Date() ).getTime();
    console.log( 'shop: ' + shop + ' -> ' + url );
    if( url.indexOf( 'bookoffonline' ) > -1 ){
      client.set( 'headers', { 'referer': 'http://www.bookoffonline.co.jp/' } );
    }else if( url.indexOf( 'rakuten' ) > -1 ){
      //. rakuten は cookie がないと 10 秒かかる
      client.set( 'headers', {
        'referer': 'https://product.rakuten.co.jp/',
        'cookie': rakuten_cookie
      } );
    }
    client.fetch( url, {}, encode, function( err, $, res, body ){
      if( err ){
        resolve( null );
      }else{
        var price = { shop: shop, cmpurl: url, price: -1 };
        switch( shop ){
        case 'rakuten':  //. 2020/Jan/27
          //. cookie 更新
          for( var key in res.cookies ){
            rakuten_cookie = res.cookies[key];
          }
          
          $('.proListItemCnt .proSearchListName .proListItemLowPrice .proPrice').each( function(){
            var p = $(this).text();
            p = p.split( ',' ).join( '' );
            p = p.trim();
            price['price'] = parseInt( p );

            $('.proListItemCnt .proListItemName table tr td a').each( function(){
              var shopurl = $(this).attr( 'href' );
              shopurl = 'http://hb.afl.rakuten.co.jp/hgc/' + ( settings.rakuten_affiliate ? settings.rakuten_affiliate : '' ) + '/?pc=' + encodeURI( shopurl ) + '&m= ' + encodeURI( shopurl );
              price['shopurl'] = shopurl;
              price['name'] = $(this).text();
            });

            $('.proSearchListImg img').each( function(){
              price['imgurl'] = $(this).attr( 'src' );
            });
          });
          break;
        case 'amazon':  //. 2020/Jan/27
          $('.s-result-list div[data-index="0"] div.a-spacing-medium a.a-link-normal').each( function(){
            var shopurl = $(this).attr( 'href' );
            if( settings.amazon_affiliate ){
              shopurl += '&tag=' + settings.amazon_affiliate;
              price['shopurl'] = 'https://www.amazon.co.jp' + shopurl;
            }

            $('.s-result-list div[data-index="0"] div.a-spacing-medium a.a-link-normal img').each( function(){
              price['name'] = $(this).attr('alt');
              price['imgurl'] = $(this).attr('src');
            });

            $('.s-result-list div[data-index="0"] div.a-spacing-medium span.a-color-price').each( function(){
              var p = $(this).text(); //. ￥327
              p = p.split( ',' ).join( '' );
              if( p.indexOf( '￥' ) == 0 ){
                p = p.substr( 1 );
              }
              p = p.trim();
              price['price'] = parseInt( p );
            });
            if( price['price'] <= 0 ){
              $('.s-result-list div[data-index="0"] div.a-spacing-medium span.a-price-whole').each( function(){
                var p = $(this).text(); //. 338
                p = p.split( ',' ).join( '' );
                if( p.indexOf( '￥' ) == 0 ){
                  p = p.substr( 1 );
                }
                p = p.trim();
                price['price'] = parseInt( p );
              });
            }
          });
          break;
        case 'yahoo':  //. 2020/Jan/27
          $('#searchResults1 ul.LoopList li.LoopList__item #i_shsrg1 a').each( function(){
            if( !price['shopurl'] ){
              var shopurl = $(this).attr( 'href' );
              price['shopurl'] = shopurl;

              $('#searchResults1 ul.LoopList li.LoopList__item ._3-CgJZLU91dR').each( function(){
                var p = $(this).text();
                if( price['price'] == -1 && isPrice( p ) ){
                  p = p.split( ',' ).join( '' );
                  price['price'] = parseInt( p );
                }
              });

              $('#searchResults1 ul.LoopList li.LoopList__item #i_shsrg1 a img').each( function(){
                price['imgurl'] = $(this).attr( 'src' );
              });
              $('#searchResults1 ul.LoopList li.LoopList__item #v_shsrg1 a').each( function(){
                price['name'] = $(this).text();
              });
            }
          });
          break;
        case 'kakaku':  //. 2020/Jan/27
          $('.p-result_list .p-result_item_cell-2 .p-item_price span').each( function(){
            var p = $(this).text();
            p = p.split( ',' ).join( '' );
            p = p.substr( 1 );  //. \ を強制削除
            if( price['price'] == -1 && isPrice( p ) ){
              price['price'] = parseInt( p );

              $('.p-result_list .p-result_item_cell-1 .p-item .c-positioning_cell a').each( function(){
                var shopurl = $(this).attr( 'href' );
                price['shopurl'] = shopurl;
              });

              $('.p-result_list .p-result_item_cell-1 .p-item .c-positioning_cell .p-item_name').each( function(){
                price['name'] = $(this).text();  //. Shift_JIS 対応しないと文字化け
              });

              $('.p-result_list .p-result_item_cell-1 .p-item .c-positioning_cell a img').each( function(){
                price['imgurl'] = $(this).attr( 'data-original' );
              });
            }
          });
          break;
        case 'kenko':
          break;
        case 'yamada':
          break;
        case 'omniseven':  //. 2020/Jan/27
          $('.mod-spetialBrand .js-allcheck .productInfoWrap .innerTop .productPriceWrap p .u-inTax span').each( function(){
            var p = $(this).text();
            p = p.split( ',' ).join( '' );
            if( price['price'] == -1 && isPrice( p ) ){
              price['price'] = parseInt( p );

              $('.mod-spetialBrand .js-allcheck .productInfoWrap .innerTop .productName a').each( function(){
                var shopurl = $(this).attr( 'href' );
                price['shopurl'] = shopurl;
              });

              $('.mod-spetialBrand .js-allcheck .productImg img').each( function(){
                price['name'] = $(this).attr( 'alt' );
                price['imgurl'] = $(this).attr( 'src' );
              });
            }
          });
          break;
        case 'bookoff':
          $('#resList .list_group .list_r .details .spec table tbody .mainprice').each( function(){
            var p = $(this).text();
            p = p.split( ',' ).join( '' );
            if( p.indexOf( '￥' ) == 0 ){
              p = p.substr( 1 );
            }
            p = p.trim();
            //console.log( p );
            if( price['price'] == -1 && isPrice( p ) ){
              price['price'] = parseInt( p );

              $('#resList .list_group .itemttl a').each( function(){
                var shopurl = $(this).attr( 'href' );
                shopurl = 'https://www.bookoffonline.co.jp' + shopurl;
                price['shopurl'] = shopurl;
              });
            }
          });
          break;
        case 'google':  //. 2020/Jan/27
          $('#res #search div.sh-dlr__list-result div.sh-dlr__content a.REX1ub').each( function(){
            if( !price['shopurl'] ){
              var shopurl = $(this).attr( 'href' );
              price['shopurl'] = 'https://www.google.co.jp' + shopurl;
              price['name'] = $(this).text();

              $('#res #search div.sh-dlr__list-result div.sh-dlr__content span.Nr22bf').each( function(){
                if( price['price'] == -1 ){
                  var p = $(this).text(); //. ￥338.
                  p = p.split( ',' ).join( '' );
                  p = p.split( '.' ).join( '' );
                  if( p.indexOf( '￥' ) == 0 ){
                    p = p.substr( 1 );
                  }
                  p = p.trim();
                  price['price'] = parseInt( p );
                }
              });

              $('#res #search div.sh-dlr__list-result div.sh-dlr__content div.sh-dlr__thumbnail img').each( function(){
                //price['imgurl'] = $(this).attr( 'src' );  // "data:image/webp;..."
              });
            }
          });
          break;
        case 'sofmap':  //. 2020/Jan/27
          $('#contents_main .search-img-textbox .normal-price span').each( function(){
            var p = $(this).text();
            p = p.split( ',' ).join( '' );
            p = p.substr( 1 );  //. \ を強制削除
            if( price['price'] == -1 && isPrice( p ) ){
              price['price'] = parseInt( p );

              $('#contents_main .list-name a').each( function(){
                var shopurl = $(this).attr( 'href' );
                price['shopurl'] = shopurl;
                price['name'] = $(this).text();  //. Shift_JIS対応しないと文字化け
              });

              $('#contents_main .medium-img-size img').each( function(){
                price['imgurl'] = $(this).attr( 'src' );
              });
            }
          });
          break;
        case 'playasia':  //. 2020/Jan/27*
          $('#n_pf_holder .p_prev a').each( function(){
            if( !price['shopurl'] ){
              var shopurl = $(this).attr( 'href' );
              if( settings.pa_affiliate ){
                shopurl += '&tagid=' + settings.pa_affiliate;
              }
              price['shopurl'] = shopurl;

              $('#n_pf_holder .p_prev .p_prev_p .prive_val').each( function(){
                var p = $(this).text();
                p = p.split( ',' ).join( '' );
                if( price['price'] == -1 && isPrice( p ) ){
                  price['price'] = parseInt( p );
                }
              });

              $('#n_pf_holder .p_prev .ovrly img').each( function(){
                price['imgurl'] = $(this).attr( 'src' );
              });

              $('#n_pf_holder .p_prev .p_prev_n').each( function(){
                price['name'] = $(this).text();
              });
            }
          });
          break;
        case 'dmm':  //. 2020/Jan/27*
          $('#main-src .d-area .d-sect .d-item ul#list li div.value p.price').each( function(){
            var p = $(this).text();
            p = p.split( ',' ).join( '' );
            var tmp = p.split( '円' );
            p = tmp[0];
            if( p == '---' ){
              price['price'] = parseInt( p );
            }

            $('#main-src .d-area .d-sect .d-item ul#list li p.tmb a').each( function(){
              var shopurl = $(this).attr( 'href' );
              if( settings.dmm_affiliate ){
                var m = shopurl.indexOf( '/searchmes=' );
                if( m > -1 ){
                  shopurl = shopurl.substring( 0, m + 1 );
                  shopurl += settings.dmm_affiliate;
                }else{
                  shopurl += settings.dmm_affiliate;
                }
              }
              price['shopurl'] = shopurl;

              $('#main-src .d-area .d-sect .d-item ul#list li p.tmb a img').each( function(){
                price['imgurl'] = $(this).attr( 'src' );
                price['name'] = $(this).attr( 'alt' );
              });
            });
          });
          break;
        }

        var ts1 = ( new Date() ).getTime();
        var diff = ts1 - ts0;
        console.log( ' shop: ' + shop + ' done.(' + ( diff / 1000.0 ) + ' s)' );
        resolve( price );
      }
    });
  });
}

async function getBasicInfo( categories ){
  return new Promise( async function( resolve, reject ){
    for( var key in categories ){
      var objs = categories[key];
      for( var j = 0; j < objs.length; j ++ ){
        var obj = objs[j];
        //. obj = { name: 'name', url: 'url' };
        getCodes( obj.url ).then( async function( result ){
          if( result ){
            for( var i = 0; i < result.ranks.length; i ++ ){
              var code = result.codes[i];
              if( code != "－" ){
                var rank = result.ranks[i];
                var maker = result.makers[i];
                var name = result.names[i];
                var avg_price = result.avg_prices[i];

                var info = {
                  //rank: rank,
                  maker: maker,
                  name: name,  //. 書き換え対象
                  avg_price: avg_price,
                  code: code
                };
                infos[code] = info;

                if( j == objs.length - 1 && i == result.ranks.length - 1 ){
                  for( var code in infos ){
                    console.log( 'code = ' + code );
                    //var info = infos[code];
                    var basicinfo = await getNameAndImage( code ); // { shop:'shop',cmpurl:'cmpurl',..}
                    infos[code]['name'] = basicinfo.name;
                    infos[code]['imgurl'] = basicinfo.imgurl;
                  }

                  resolve( infos );
                }
              }
            }
          }
        });
      }
    }
  });
}

async function getNameAndImage( code ){
  return new Promise( function( resolve, reject ){
    //. amazon から取得
    var url = 'https://www.amazon.co.jp/s/ref=nb_sb_noss?field-keywords=' + code + '&sort=price-asc-rank';
    getHTML( url, "UTF-8", "amazon" ).then( function( body ){
      resolve( body );
    });
  });
}

function isPrice( str ){
  return ( str.search( /^[0-9]+([\,0-9]+)?$/ ) > -1 );
}

module.exports = router;
