YUI({
  combine: true,
  comboBase: '/yui3?',
  root: '3.11.0/build/'
}).use('node', 'querystring-parse-simple','querystring-stringify', function (Y) {
    var pager = Y.one('.pager')
      , aligner
      , pageCount
      , currentPage
      , i=0, page, str, arr = []

    function generateHref(parsed, page, current) {
      parsed.page = page;
      var href =location.pathname+'?' + Y.QueryString.stringify(parsed);
      return (current ? '<li class="current">' : '<li>') +
        '<a href="' + href + '">' + page +'</a></li>';
    }

    // TODO: add "..." for large number of pages
    if(pager) {
      aligner = Y.Node.create('<ul>');

      pageCount = parseInt(pager.getHTML());

      var parsedQuery = Y.QueryString.parse(location.search.slice(1));
      currentPage = parsedQuery.page ? parseInt(parsedQuery.page, 10) : 1;

      for(; i<pageCount; i++) {
        page = i+1;

        str = generateHref(parsedQuery, page, !!( page === currentPage));

        arr.push(str);
      }

      aligner.setHTML(arr.join(''));
      pager.setHTML(aligner);
      pager.removeClass('hidden');
    }
  })