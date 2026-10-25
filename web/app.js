(function () {
  'use strict';

  var OVERPASS = 'https://overpass.opengeofiction.net/api/interpreter';
  var TILE_URL = 'https://tile.opengeofiction.net/ogf-carto/{z}/{x}/{y}.png';
  var OGF = 'https://opengeofiction.net';
  var PAGE = 60;
  var MAX_MARKERS = 800;
  var FETCH_TIMEOUT = 40000;

  var GROUP_LABEL = {
    zh: {
      shop: '零售', amenity: '设施', tourism: '旅宿', office: '办公', craft: '工坊',
      leisure: '休闲', healthcare: '医疗', public_transport: '公共交通', railway: '铁路', highway: '道路'
    },
    en: {
      shop: 'Retail', amenity: 'Amenities', tourism: 'Tourism', office: 'Offices', craft: 'Crafts',
      leisure: 'Leisure', healthcare: 'Healthcare', public_transport: 'Public transport', railway: 'Railway', highway: 'Roads'
    }
  };

  var LABELS = {
    zh: {
    'amenity=fuel': '加油站', 'amenity=restaurant': '餐厅', 'amenity=cafe': '咖啡馆', 'amenity=bank': '银行',
    'amenity=pharmacy': '药店', 'amenity=bar': '酒吧', 'amenity=pub': '酒馆', 'amenity=fast_food': '快餐',
    'amenity=parking': '停车场', 'amenity=cinema': '影院', 'amenity=theatre': '剧院', 'amenity=hospital': '医院',
    'amenity=clinic': '诊所', 'amenity=doctors': '诊所', 'amenity=dentist': '牙科', 'amenity=school': '学校',
    'amenity=university': '大学', 'amenity=college': '学院', 'amenity=library': '图书馆',
    'amenity=post_office': '邮局', 'amenity=marketplace': '市场', 'amenity=police': '警局',
    'amenity=fire_station': '消防站', 'amenity=townhall': '市政厅', 'amenity=courthouse': '法院',
    'amenity=community_centre': '社区中心', 'amenity=place_of_worship': '宗教场所',
    'amenity=charging_station': '充电站', 'amenity=bus_station': '客运站', 'amenity=ferry_terminal': '渡轮码头',
    'amenity=nightclub': '夜店', 'amenity=fitness_centre': '健身中心', 'amenity=sports_centre': '体育中心',
    'amenity=swimming_pool': '泳池', 'amenity=veterinary': '兽医', 'amenity=food_court': '美食广场',
    'amenity=ice_cream': '冰淇淋', 'amenity=driving_school': '驾校', 'amenity=car_rental': '租车',
    'amenity=car_wash': '洗车', 'amenity=bicycle_rental': '单车租赁', 'amenity=atm': '取款机',
    'amenity=recycling': '回收站', 'amenity=waste_transfer_station': '垃圾转运',
    'shop=supermarket': '超市', 'shop=convenience': '便利店', 'shop=clothes': '服装',
    'shop=bakery': '烘焙', 'shop=butcher': '肉店', 'shop=department_store': '百货',
    'shop=mall': '购物中心', 'shop=car': '车行', 'shop=car_repair': '汽修', 'shop=hardware': '五金',
    'shop=furniture': '家具', 'shop=electronics': '电器', 'shop=florist': '花店', 'shop=books': '书店',
    'shop=stationery': '文具', 'shop=shoes': '鞋店', 'shop=sports': '运动用品', 'shop=chemist': '药妆',
    'shop=alcohol': '酒类', 'shop=wine': '酒窖', 'shop=tobacco': '烟草', 'shop=travel_agency': '旅行社',
    'shop=jewelry': '珠宝', 'shop=toys': '玩具', 'shop=pet': '宠物', 'shop=mobile_phone': '手机',
    'shop=optician': '眼镜', 'shop=greengrocer': '果蔬', 'shop=beauty': '美容', 'shop=hairdresser': '理发',
    'shop=laundry': '洗衣', 'shop=dry_cleaning': '干洗', 'shop=photo': '照相', 'shop=computer': '电脑',
    'shop=gift': '礼品', 'shop=variety_store': '杂货', 'shop=wholesale': '批发', 'shop=doityourself': '建材',
    'shop=agrarian': '农资', 'shop=outdoor': '户外', 'shop=musical_instrument': '乐器',
    'shop=cosmetics': '化妆品', 'shop=confectionery': '糖果', 'shop=deli': '熟食', 'shop=seafood': '海鲜',
    'shop=tea': '茶叶', 'shop=coffee': '咖啡豆', 'shop=general': '杂货铺', 'shop=paint': '涂料',
    'shop=gas': '燃气', 'shop=fuel': '燃料', 'shop=lottery': '彩票', 'shop=newsagent': '报刊',
    'shop=motorcycle': '摩托', 'shop=agricultural': '农机', 'shop=country_store': '乡村商店',
    'tourism=hotel': '酒店', 'tourism=motel': '汽车旅馆', 'tourism=guest_house': '民宿',
    'tourism=hostel': '旅舍', 'tourism=apartment': '公寓', 'tourism=chalet': '度假屋',
    'tourism=camp_site': '营地', 'tourism=caravan_site': '房车营', 'tourism=museum': '博物馆',
    'tourism=gallery': '画廊', 'tourism=attraction': '景点', 'tourism=theme_park': '主题公园',
    'tourism=zoo': '动物园', 'tourism=viewpoint': '观景点', 'tourism=information': '信息点',
    'tourism=resort': '度假区', 'tourism=picnic_site': '野餐区',
    'office=company': '公司', 'office=insurance': '保险', 'office=estate_agent': '房产',
    'office=government': '政府', 'office=financial': '金融', 'office=lawyer': '律所',
    'office=it': '信息技术', 'office=telecommunication': '电信', 'office=research': '研究',
    'office=educational_institution': '教育机构', 'office=newspaper': '报社', 'office=notary': '公证',
    'office=accountant': '会计', 'office=employment_agency': '职业介绍', 'office=travel_agent': '票务',
    'office=logistics': '物流', 'office=advertising_agency': '广告',
    'craft=brewery': '啤酒厂', 'craft=bakery': '烘焙坊', 'craft=car_repair': '汽修',
    'craft=carpenter': '木工', 'craft=electrician': '电工', 'craft=plumber': '水管',
    'craft=tailor': '裁缝', 'craft=photographer': '摄影', 'craft=printer': '印刷',
    'craft=stonemason': '石匠', 'craft=distillery': '蒸馏厂', 'craft=winery': '酒庄',
    'craft=metal_construction': '金属加工', 'craft=joiner': '细木工',
    'leisure=fitness_centre': '健身', 'leisure=sports_centre': '体育中心', 'leisure=bowling_alley': '保龄球',
    'leisure=amusement_arcade': '游戏厅', 'leisure=water_park': '水上乐园',
    'healthcare=clinic': '诊所', 'healthcare=dentist': '牙科', 'healthcare=hospital': '医院',
    'healthcare=pharmacy': '药房', 'healthcare=doctor': '医生', 'healthcare=centre': '医疗中心',
    'healthcare=laboratory': '化验室',
    'public_transport=station': '车站', 'public_transport=platform': '站台',
    'public_transport=stop_position': '停靠点',
    'railway=station': '火车站', 'railway=halt': '小站', 'railway=tram_stop': '电车站',
    'railway=subway_entrance': '地铁口', 'railway=level_crossing': '平交道', 'railway=signal': '信号机',
    'railway=yard': '站场', 'railway=depot': '车辆段', 'railway=works': '工场', 'railway=crossing': '道口',
    'railway=platform': '站台', 'railway=buffer_stop': '止冲挡', 'railway=turntable': '转车台',
    'highway=bus_stop': '公交站', 'highway=services': '服务区', 'highway=rest_area': '休息区',
    'highway=toll_booth': '收费站'
    },
    en: {
      'amenity=fuel': 'Fuel station', 'amenity=restaurant': 'Restaurant', 'amenity=cafe': 'Café', 'amenity=bank': 'Bank',
      'amenity=pharmacy': 'Pharmacy', 'amenity=bar': 'Bar', 'amenity=pub': 'Pub', 'amenity=fast_food': 'Fast food',
      'amenity=parking': 'Parking', 'amenity=cinema': 'Cinema', 'amenity=theatre': 'Theatre', 'amenity=hospital': 'Hospital',
      'amenity=clinic': 'Clinic', 'amenity=doctors': 'Doctor’s office', 'amenity=dentist': 'Dentist', 'amenity=school': 'School',
      'amenity=university': 'University', 'amenity=college': 'College', 'amenity=library': 'Library',
      'amenity=post_office': 'Post office', 'amenity=marketplace': 'Marketplace', 'amenity=police': 'Police station',
      'amenity=fire_station': 'Fire station', 'amenity=townhall': 'Town hall', 'amenity=courthouse': 'Courthouse',
      'amenity=community_centre': 'Community centre', 'amenity=place_of_worship': 'Place of worship',
      'amenity=charging_station': 'Charging station', 'amenity=bus_station': 'Bus station', 'amenity=ferry_terminal': 'Ferry terminal',
      'amenity=nightclub': 'Nightclub', 'amenity=fitness_centre': 'Fitness centre', 'amenity=sports_centre': 'Sports centre',
      'amenity=swimming_pool': 'Swimming pool', 'amenity=veterinary': 'Veterinary clinic', 'amenity=food_court': 'Food court',
      'amenity=ice_cream': 'Ice cream', 'amenity=driving_school': 'Driving school', 'amenity=car_rental': 'Car rental',
      'amenity=car_wash': 'Car wash', 'amenity=bicycle_rental': 'Bicycle rental', 'amenity=atm': 'ATM',
      'amenity=recycling': 'Recycling point', 'amenity=waste_transfer_station': 'Waste transfer station',
      'shop=supermarket': 'Supermarket', 'shop=convenience': 'Convenience store', 'shop=clothes': 'Clothing',
      'shop=bakery': 'Bakery', 'shop=butcher': 'Butcher', 'shop=department_store': 'Department store',
      'shop=mall': 'Shopping mall', 'shop=car': 'Car dealer', 'shop=car_repair': 'Car repair', 'shop=hardware': 'Hardware store',
      'shop=furniture': 'Furniture', 'shop=electronics': 'Electronics', 'shop=florist': 'Florist', 'shop=books': 'Bookshop',
      'shop=stationery': 'Stationery', 'shop=shoes': 'Shoes', 'shop=sports': 'Sports goods', 'shop=chemist': 'Chemist',
      'shop=alcohol': 'Liquor store', 'shop=wine': 'Wine shop', 'shop=tobacco': 'Tobacco', 'shop=travel_agency': 'Travel agency',
      'shop=jewelry': 'Jewellery', 'shop=toys': 'Toys', 'shop=pet': 'Pet shop', 'shop=mobile_phone': 'Mobile phones',
      'shop=optician': 'Optician', 'shop=greengrocer': 'Greengrocer', 'shop=beauty': 'Beauty salon', 'shop=hairdresser': 'Hairdresser',
      'shop=laundry': 'Laundry', 'shop=dry_cleaning': 'Dry cleaning', 'shop=photo': 'Photo studio', 'shop=computer': 'Computers',
      'shop=gift': 'Gifts', 'shop=variety_store': 'Variety store', 'shop=wholesale': 'Wholesale', 'shop=doityourself': 'DIY store',
      'shop=agrarian': 'Farm supplies', 'shop=outdoor': 'Outdoor gear', 'shop=musical_instrument': 'Musical instruments',
      'shop=cosmetics': 'Cosmetics', 'shop=confectionery': 'Confectionery', 'shop=deli': 'Deli', 'shop=seafood': 'Seafood',
      'shop=tea': 'Tea', 'shop=coffee': 'Coffee beans', 'shop=general': 'General store', 'shop=paint': 'Paint',
      'shop=gas': 'Gas', 'shop=fuel': 'Fuel', 'shop=lottery': 'Lottery', 'shop=newsagent': 'Newsagent',
      'shop=motorcycle': 'Motorcycles', 'shop=agricultural': 'Farm machinery', 'shop=country_store': 'Country store',
      'tourism=hotel': 'Hotel', 'tourism=motel': 'Motel', 'tourism=guest_house': 'Guest house',
      'tourism=hostel': 'Hostel', 'tourism=apartment': 'Apartment', 'tourism=chalet': 'Chalet',
      'tourism=camp_site': 'Campsite', 'tourism=caravan_site': 'Caravan site', 'tourism=museum': 'Museum',
      'tourism=gallery': 'Gallery', 'tourism=attraction': 'Attraction', 'tourism=theme_park': 'Theme park',
      'tourism=zoo': 'Zoo', 'tourism=viewpoint': 'Viewpoint', 'tourism=information': 'Information',
      'tourism=resort': 'Resort', 'tourism=picnic_site': 'Picnic site',
      'office=company': 'Company', 'office=insurance': 'Insurance', 'office=estate_agent': 'Estate agent',
      'office=government': 'Government', 'office=financial': 'Financial', 'office=lawyer': 'Law firm',
      'office=it': 'IT', 'office=telecommunication': 'Telecom', 'office=research': 'Research',
      'office=educational_institution': 'Educational institution', 'office=newspaper': 'Newspaper', 'office=notary': 'Notary',
      'office=accountant': 'Accountant', 'office=employment_agency': 'Employment agency', 'office=travel_agent': 'Travel agent',
      'office=logistics': 'Logistics', 'office=advertising_agency': 'Advertising agency',
      'craft=brewery': 'Brewery', 'craft=bakery': 'Bakery', 'craft=car_repair': 'Car repair',
      'craft=carpenter': 'Carpenter', 'craft=electrician': 'Electrician', 'craft=plumber': 'Plumber',
      'craft=tailor': 'Tailor', 'craft=photographer': 'Photographer', 'craft=printer': 'Printer',
      'craft=stonemason': 'Stonemason', 'craft=distillery': 'Distillery', 'craft=winery': 'Winery',
      'craft=metal_construction': 'Metalwork', 'craft=joiner': 'Joiner',
      'leisure=fitness_centre': 'Fitness', 'leisure=sports_centre': 'Sports centre', 'leisure=bowling_alley': 'Bowling alley',
      'leisure=amusement_arcade': 'Amusement arcade', 'leisure=water_park': 'Water park',
      'healthcare=clinic': 'Clinic', 'healthcare=dentist': 'Dentist', 'healthcare=hospital': 'Hospital',
      'healthcare=pharmacy': 'Pharmacy', 'healthcare=doctor': 'Doctor', 'healthcare=centre': 'Health centre',
      'healthcare=laboratory': 'Laboratory',
      'public_transport=station': 'Station', 'public_transport=platform': 'Platform',
      'public_transport=stop_position': 'Stop',
      'railway=station': 'Railway station', 'railway=halt': 'Halt', 'railway=tram_stop': 'Tram stop',
      'railway=subway_entrance': 'Subway entrance', 'railway=level_crossing': 'Level crossing', 'railway=signal': 'Signal',
      'railway=yard': 'Yard', 'railway=depot': 'Depot', 'railway=works': 'Works', 'railway=crossing': 'Crossing',
      'railway=platform': 'Platform', 'railway=buffer_stop': 'Buffer stop', 'railway=turntable': 'Turntable',
      'highway=bus_stop': 'Bus stop', 'highway=services': 'Services', 'highway=rest_area': 'Rest area',
      'highway=toll_booth': 'Toll booth'
    }
  };

  var I18N = {
    zh: {
      kicker: 'OpenGeofiction · 商号档案',
      wordmark: '商号索引',
      loadingIndex: '索引载入中',
      skip: '跳到主要内容',
      brands: '品牌',
      operators: '运营者',
      brandElements: '品牌要素',
      operatorElements: '运营者要素',
      search: '搜索',
      searchPlaceholder: '搜索商号、运营者、分号或城市',
      indexKinds: '索引类别',
      scope: '范围',
      scopeAria: '按 admin_level=2 国家筛选',
      global: '全球 · 全部国家',
      sort: '排序',
      sortCount: '要素数',
      sortName: '名称',
      sortBranches: '分号数',
      indexTitle: '商号索引',
      facetsAria: '按类别筛选',
      all: '全部',
      continue: '继续显示',
      showMore: '继续显示（还有 {n} 项）',
      back: '← 回到索引',
      mapHead: '世界分布',
      querying: '正在查询…',
      elemsHead: '要素与标签',
      tagPrompt: '从左侧列表或地图上选一个要素，这里会列出它的全部 OSM 标签。',
      brandFile: '品牌档案',
      operatorFile: '运营者档案',
      scopenote: '范围 {name}',
      snapElements: '快照要素 {n}',
      actualElements: '{n} 个要素',
      actualBranches: '{m} 个分号',
      opPrefix: '运营者 {names}',
      brandPrefix: '品牌 {names}',
      operatorCountMore: ' 等 {n} 家',
      brandCountMore: ' 等 {n} 个',
      noOperator: '未标注运营者',
      noBrand: '未标注品牌',
      networkPrefix: '网络 {name}',
      uncategorised: '未分类',
      entries: '{n} 项',
      scopePrefix: '范围 {name}',
      queryPrefix: '关键词「{q}」',
      categoryPrefix: '类别 {name}',
      countryOption: '{name} · {n} 要素',
      scopeTitle: '按 admin_level=2 国家筛选索引',
      scopeTitleDisabled: '运营者索引暂不支持国家筛选',
      titleBase: 'OGF 商号索引 · OpenGeofiction 虚构品牌名录',
      titleScoped: '{name} · OGF 商号索引',
      metaDesc: '按 brand、operator、branch 标签汇总 OpenGeofiction 世界的虚构品牌与运营者；点开一家商号即可查看它的全球分布与要素标签。',
      loadingScope: '正在载入 {name} 的品牌索引…',
      failedScope: '{name} 的索引没能载入',
      loadingList: '正在载入{kind}名录…',
      failedList: '{kind}名录没能载入',
      brandsLower: '品牌',
      operatorsLower: '运营者',
      countryMissing: '找不到这个国家',
      countryMissingBody: '索引里没有 admin_level=2 关系「{id}」。可以回到全球索引重新选择。',
      missingScopeCountry: '索引里没有这个国家范围（{id}）。',
      backGlobal: '返回全球索引',
      loadingFile: '正在载入档案…',
      loadingFileState: '正在载入索引档案…',
      failedFile: '{kind}档案载入失败：{msg}',
      brandMissing: '索引里没有找到「{name}」{scope}。它可能已被合并或改名，可以回到索引重新搜索。',
      missingScopeSuffix: '（范围 {name}）',
      noTags: '没有可显示的标签。',
      factsMore: '快照里这家商号没有更多附属信息。',
      chipsOperators: '运营者',
      chipsBrands: '旗下品牌',
      chipsBranches: '分号名',
      chipsCities: '出现城市',
      chipsNetworks: '所属网络',
      chipsNames: '标注名称',
      branchesTotal: '{n} 个',
      mapQuerying: '正在向 Overpass 查询该{kind}在{scope}范围内的分布…',
      mapQueryingGlobal: '正在向 Overpass 查询该{kind}的分布…',
      mapMeta: '{total} 个要素 · 地图显示 {shown}{more}',
      mapTruncated: '（已截断）',
      mapTruncTitle: '单个品牌要素过多，只取前 {n} 个绘制',
      mapNoCoords: '这家商号目前在 OpenGeofiction 上没有带坐标的要素。',
      elemNote: '共 {total} 个要素{more} · 点击查看标签',
      elemNoteMore: '，列出前 {shown} 个',
      abort: '查询超过 {s} 秒被中断。',
      failQuery: '查询失败：{msg}。',
      netError: '网络错误',
      retryHint: ' 可以刷新页面重试。',
      queryFailed: '查询失败',
      unnamed: '未命名要素',
      openInOgf: '在 OpenGeofiction 打开 {id} →',
      openInOgfShort: '在 OpenGeofiction 打开 →',
      attribution: '© OpenGeofiction 贡献者',
      tagEmpty: '这个要素没有标签。',
      stamp: '快照 {gen} · 数据库 {db}',
      footStamp: '索引快照 {gen}，数据库时间 {db}。',
      loadFailed: '索引没能载入',
      loadFailedBody: 'data/meta.json 读取失败（{msg}）。如果是本地打开，请通过 HTTP 服务访问这个目录。',
      retry: '重试',
      footNote: '数据来自 <a href="https://opengeofiction.net/" target="_blank" rel="noopener">OpenGeofiction</a> 贡献者，以 ODbL 授权。索引为构建时快照，地图与标签在点开商号时实时查询 <code>overpass.opengeofiction.net</code>。',
      noscript: '这个页面需要 JavaScript 才能读取索引与地图数据。',
      loadInfo: '索引 {size} · 载入 {ms} ms',
      brandSingular: '品牌',
      operatorSingular: '运营者',
      namesJoin: '、'
    },
    en: {
      kicker: 'OpenGeofiction · Brand register',
      wordmark: 'Brand index',
      loadingIndex: 'Loading index',
      skip: 'Skip to main content',
      brands: 'Brands',
      operators: 'Operators',
      brandElements: 'Branded elements',
      operatorElements: 'Operated elements',
      search: 'Search',
      searchPlaceholder: 'Search brands, operators, branches or cities',
      indexKinds: 'Index type',
      scope: 'Scope',
      scopeAria: 'Filter by admin_level=2 country',
      global: 'Global · all countries',
      sort: 'Sort',
      sortCount: 'Elements',
      sortName: 'Name',
      sortBranches: 'Branches',
      indexTitle: 'Brand index',
      facetsAria: 'Filter by category',
      all: 'All',
      continue: 'Show more',
      showMore: 'Show more ({n} remaining)',
      back: '← Back to index',
      mapHead: 'World distribution',
      querying: 'Querying…',
      elemsHead: 'Elements & tags',
      tagPrompt: 'Pick an element from the list or the map to see all its OSM tags.',
      brandFile: 'Brand file',
      operatorFile: 'Operator file',
      scopenote: 'Scope: {name}',
      snapElements: 'Snapshot elements {n}',
      actualElements: '{n} elements',
      actualBranches: '{m} branches',
      opPrefix: 'Operator {names}',
      brandPrefix: 'Brand {names}',
      operatorCountMore: ' +{n} more',
      brandCountMore: ' +{n} more',
      noOperator: 'No operator tagged',
      noBrand: 'No brand tagged',
      networkPrefix: 'Network {name}',
      uncategorised: 'Uncategorised',
      entries: '{n} entries',
      scopePrefix: 'Scope: {name}',
      queryPrefix: 'Query “{q}”',
      categoryPrefix: 'Category: {name}',
      countryOption: '{name} · {n} elements',
      scopeTitle: 'Filter the index by admin_level=2 country',
      scopeTitleDisabled: 'Country filtering is not available for operators',
      titleBase: 'OGF Brand Index · Fictional brands of OpenGeofiction',
      titleScoped: '{name} · OGF Brand Index',
      metaDesc: 'Fictional brands and operators of the OpenGeofiction world, aggregated from brand, operator and branch tags. Open a brand to see its worldwide distribution and element tags.',
      loadingScope: 'Loading the brand index for {name}…',
      failedScope: 'Could not load the index for {name}',
      loadingList: 'Loading {kind}…',
      failedList: 'Could not load {kind}',
      brandsLower: 'brands',
      operatorsLower: 'operators',
      countryMissing: 'Country not found',
      countryMissingBody: 'The index has no admin_level=2 relation “{id}”. Go back to the global index and pick again.',
      missingScopeCountry: 'The index has no such country scope ({id}).',
      backGlobal: 'Back to global index',
      loadingFile: 'Loading entry…',
      loadingFileState: 'Loading index entry…',
      failedFile: 'Could not load the {kind} entry: {msg}',
      brandMissing: '“{name}” was not found in the index{scope}. It may have been merged or renamed — go back and search again.',
      missingScopeSuffix: ' (scope: {name})',
      noTags: 'No tags to show.',
      factsMore: 'The snapshot has no further details for this entry.',
      chipsOperators: 'Operators',
      chipsBrands: 'Brands',
      chipsBranches: 'Branch names',
      chipsCities: 'Cities',
      chipsNetworks: 'Networks',
      chipsNames: 'Also named',
      branchesTotal: '{n} total',
      mapQuerying: 'Querying Overpass for this {kind} in {scope}…',
      mapQueryingGlobal: 'Querying Overpass for this {kind}’s distribution…',
      mapMeta: '{total} elements · showing {shown}{more}',
      mapTruncated: ' (truncated)',
      mapTruncTitle: 'Too many elements for one brand; only the first {n} are drawn',
      mapNoCoords: 'This entry currently has no elements with coordinates on OpenGeofiction.',
      elemNote: '{total} elements{more} · click to view tags',
      elemNoteMore: ', listing the first {shown}',
      abort: 'The query was interrupted after {s} seconds.',
      failQuery: 'Query failed: {msg}.',
      netError: 'network error',
      retryHint: ' Reload the page to try again.',
      queryFailed: 'Query failed',
      unnamed: 'Unnamed element',
      openInOgf: 'Open {id} in OpenGeofiction →',
      openInOgfShort: 'Open in OpenGeofiction →',
      attribution: '© OpenGeofiction contributors',
      tagEmpty: 'This element has no tags.',
      stamp: 'Snapshot {gen} · database {db}',
      footStamp: 'Index snapshot {gen}, database time {db}.',
      loadFailed: 'The index could not be loaded',
      loadFailedBody: 'Reading data/meta.json failed ({msg}). If you opened this locally, serve the folder over HTTP.',
      retry: 'Retry',
      footNote: 'Data by <a href="https://opengeofiction.net/" target="_blank" rel="noopener">OpenGeofiction</a> contributors, licensed under ODbL. The index is a build-time snapshot; maps and tags are queried live from <code>overpass.opengeofiction.net</code> when you open an entry.',
      noscript: 'This page needs JavaScript to load the index and map data.',
      loadInfo: 'Index {size} · loaded {ms} ms',
      brandSingular: 'brand',
      operatorSingular: 'operator',
      namesJoin: ', '
    }
  };

  var LANG = 'zh';
  try {
    var savedLang = localStorage.getItem('ogf-lang');
    if (savedLang === 'en' || savedLang === 'zh') LANG = savedLang;
  } catch (e) { /* storage may be blocked */ }

  function t(key, vars) {
    var dict = I18N[LANG] || I18N.zh;
    var s = dict[key] != null ? dict[key] : I18N.zh[key];
    if (s == null) return key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, k) {
        return vars[k] == null ? '' : String(vars[k]);
      });
    }
    return s;
  }
  function isEn() { return LANG === 'en'; }

  var OP_FILTERS = [
    ['node', 'public_transport'], ['node', 'amenity'], ['way', 'amenity'], ['node', 'shop'], ['way', 'shop'],
    ['node', 'tourism'], ['way', 'tourism'], ['node', 'office'], ['way', 'office'], ['node', 'craft'],
    ['node', 'leisure'], ['way', 'leisure'], ['node', 'healthcare'], ['way', 'healthcare']
  ];

  var el = {
    mastStamp: document.getElementById('mastStamp'),
    footStamp: document.getElementById('footStamp'),
    footNote: document.getElementById('footNote'),
    metaDesc: document.getElementById('metaDesc'),
    snapshot: document.getElementById('snapshot'),
    statBrands: document.getElementById('statBrands'),
    statOperators: document.getElementById('statOperators'),
    statElements: document.getElementById('statElements'),
    statBranches: document.getElementById('statBranches'),
    tabBrand: document.getElementById('tabBrand'),
    tabOperator: document.getElementById('tabOperator'),
    q: document.getElementById('q'),
    sort: document.getElementById('sort'),
    country: document.getElementById('country'),
    loadInfo: document.getElementById('loadInfo'),
    facets: document.getElementById('facets'),
    resultCount: document.getElementById('resultCount'),
    list: document.getElementById('list'),
    showMore: document.getElementById('showMore'),
    state: document.getElementById('state'),
    viewIndex: document.getElementById('viewIndex'),
    viewDetail: document.getElementById('viewDetail'),
    detailHead: document.getElementById('detailHead'),
    facts: document.getElementById('facts'),
    mapMeta: document.getElementById('mapMeta'),
    mapState: document.getElementById('mapState'),
    elemNote: document.getElementById('elemNote'),
    elemList: document.getElementById('elemList'),
    tagPanel: document.getElementById('tagPanel'),
    backLink: document.getElementById('backLink')
  };

  var state = {
    meta: null,
    lists: { brand: null, operator: null },
    loading: {},
    listStats: {},
    kind: 'brand',
    scope: '',
    scoped: null,
    loadingScope: {},
    query: '',
    cat: '',
    sort: 'count',
    limit: PAGE,
    route: { view: 'index' },
    elements: [],
    selected: null,
    item: null,
    itemKind: '',
    itemScope: '',
    mapInfo: null,
    map: null,
    tile: null,
    layer: null,
    markers: {},
    token: 0
  };

  /* ---------- helpers ---------- */
  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escQl(v) {
    return String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ');
  }
  function catLabel(key) {
    var dict = LABELS[LANG] || LABELS.zh;
    if (dict[key]) return dict[key];
    var i = key.indexOf('=');
    var groups = GROUP_LABEL[LANG] || GROUP_LABEL.zh;
    var group = groups[key.slice(0, i)];
    return group ? group + ' · ' + key.slice(i + 1) : key.slice(i + 1);
  }
  function fmtNum(n) {
    return (n == null ? '—' : Number(n).toLocaleString('en-US'));
  }
  function fmtStamp(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ' UTC';
  }
  function fmtBytes(n) {
    if (n == null) return '—';
    if (n >= 1048576) return (n / 1048576).toFixed(2) + ' MB';
    if (n >= 1024) return Math.round(n / 1024) + ' KB';
    return n + ' B';
  }
  function textBytes(text) {
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(text).length;
    return text.length * 2;
  }
  function scopeCountry() {
    if (!state.scope || !state.meta) return null;
    return (state.meta.countries || []).filter(function (c) { return c.id === state.scope; })[0] || null;
  }
  function scopedDoc() {
    return state.scoped && state.scoped.id === state.scope ? state.scoped : null;
  }
  function items() {
    if (state.kind === 'brand') {
      var doc = scopedDoc();
      if (state.scope) return doc ? doc.brands : [];
      return state.lists.brand || [];
    }
    return state.lists.operator || [];
  }

  function ensureList(kind) {
    if (state.lists[kind]) return Promise.resolve(state.lists[kind]);
    if (state.loading[kind]) return state.loading[kind];
    var file = 'data/' + (kind === 'brand' ? 'brands' : 'operators') + '.json';
    var started = performance.now();
    state.loading[kind] = fetch(file).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var len = r.headers.get('content-length');
      return r.text().then(function (text) {
        state.listStats[kind] = {
          bytes: len ? Number(len) : textBytes(text),
          ms: Math.round(performance.now() - started)
        };
        return JSON.parse(text);
      });
    }).then(function (list) {
      state.lists[kind] = list;
      state.loading[kind] = null;
      return list;
    }, function (err) {
      state.loading[kind] = null;
      throw err;
    });
    return state.loading[kind];
  }

  function ensureScope(id) {
    if (scopedDoc() && state.scope === id) return Promise.resolve(state.scoped);
    if (state.loadingScope[id]) return state.loadingScope[id];
    var started = performance.now();
    state.loadingScope[id] = fetch('data/countries/' + id + '.json').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var len = r.headers.get('content-length');
      return r.text().then(function (text) {
        var doc = JSON.parse(text);
        doc._bytes = len ? Number(len) : textBytes(text);
        doc._ms = Math.round(performance.now() - started);
        return doc;
      });
    }).then(function (doc) {
      if (state.scope === id) state.scoped = doc;
      state.loadingScope[id] = null;
      return doc;
    }, function (err) {
      state.loadingScope[id] = null;
      throw err;
    });
    return state.loadingScope[id];
  }

  function updateLoadInfo() {
    var stat = null;
    if (state.kind === 'brand' && state.scope) {
      var doc = scopedDoc();
      if (doc) stat = { bytes: doc._bytes, ms: doc._ms };
    } else {
      stat = state.listStats[state.kind];
    }
    el.loadInfo.textContent = stat
      ? t('loadInfo', { size: fmtBytes(stat.bytes), ms: stat.ms })
      : '';
  }

  function updateStamps() {
    if (!state.meta) return;
    var gen = fmtStamp(state.meta.generatedAt);
    var db = fmtStamp(state.meta.dbTimestamp);
    var stamp = t('stamp', { gen: gen, db: db });
    el.mastStamp.textContent = stamp;
    el.snapshot.textContent = stamp;
    el.footStamp.textContent = t('footStamp', { gen: gen, db: db });
  }

  function updateTitle() {
    if (!state.meta) { document.title = t('titleBase'); return; }
    var scoped = state.kind === 'brand' ? scopeCountry() : null;
    document.title = scoped ? t('titleScoped', { name: scoped.name }) : t('titleBase');
  }

  function updateAttribution() {
    if (!state.tile || !state.map) return;
    state.tile.options.attribution = t('attribution') + ' · ODbL';
    if (state.map.attributionControl && state.map.attributionControl._update) {
      state.map.attributionControl._update();
    }
  }

  function applyStaticLang() {
    document.documentElement.lang = isEn() ? 'en' : 'zh-CN';
    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      n.textContent = t(n.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (n) {
      n.setAttribute('placeholder', t(n.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (n) {
      n.setAttribute('aria-label', t(n.getAttribute('data-i18n-aria')));
    });
    if (el.metaDesc) el.metaDesc.setAttribute('content', t('metaDesc'));
    if (el.footNote) el.footNote.innerHTML = t('footNote');
    document.querySelectorAll('.langbtn').forEach(function (b) {
      var on = b.getAttribute('data-lang') === LANG;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (!state.meta) el.mastStamp.textContent = t('loadingIndex');
    updateStamps();
    updateTitle();
    updateAttribution();
  }

  function setLang(lang) {
    LANG = lang === 'en' ? 'en' : 'zh';
    try { localStorage.setItem('ogf-lang', LANG); } catch (e) { /* ignore */ }
    applyStaticLang();
    el.country.innerHTML = '';
    if (!state.meta) return;
    if (state.route.view === 'detail') {
      var same = state.item && state.itemKind === state.route.kind && state.item.name === state.route.name;
      if (same) {
        var scoped = state.itemScope ? scopeCountry() : null;
        paintDetail(state.item, state.itemKind, scoped);
        renderElementList();
        updateMapTexts();
        state.elements.forEach(function (e) {
          var m = state.markers[e.type + '/' + e.id];
          if (m) m.setPopupContent(popupHtml(e));
        });
        if (state.selected) {
          var sel = state.elements.filter(function (e) { return e.type + '/' + e.id === state.selected; })[0];
          if (sel) renderTags(sel);
        }
        return;
      }
      renderDetail(state.route.kind, state.route.name, state.route.scope);
      return;
    }
    renderIndex();
  }

  /* ---------- routing ---------- */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    if (!h) return { view: 'index' };
    var qi = h.indexOf('?');
    var path = qi >= 0 ? h.slice(0, qi) : h;
    var qs = qi >= 0 ? h.slice(qi + 1) : '';
    var parts = path.split('/');
    var name = parts.slice(1).map(decodeURIComponent).join('/');
    if ((parts[0] === 'b' || parts[0] === 'o') && name) {
      var params = new URLSearchParams(qs);
      return {
        view: 'detail',
        kind: parts[0] === 'b' ? 'brand' : 'operator',
        name: name,
        scope: params.get('c') || ''
      };
    }
    if (parts[0] === 'c' && parts[1]) return { view: 'index', scope: parts[1] };
    return { view: 'index' };
  }
  function detailHash(kind, name) {
    var scope = kind === 'brand' && state.scope ? '?c=' + encodeURIComponent(state.scope) : '';
    return '#/' + (kind === 'brand' ? 'b' : 'o') + '/' + encodeURIComponent(name) + scope;
  }
  function indexHash(scope) { return scope ? '#/c/' + encodeURIComponent(scope) : '#/'; }

  function render() {
    state.route = parseHash();
    if (state.route.view === 'detail') {
      state.kind = state.route.kind;
      state.scope = state.route.scope || '';
      el.viewIndex.hidden = true;
      el.viewDetail.hidden = false;
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      renderDetail(state.route.kind, state.route.name, state.scope);
    } else {
      state.scope = state.route.scope || '';
      el.viewDetail.hidden = true;
      el.viewIndex.hidden = false;
      renderIndex();
    }
  }

  /* ---------- index ---------- */
  function facetList() {
    if (!state.meta) return [];
    var src;
    if (state.kind === 'brand' && state.scope) {
      var doc = scopedDoc();
      src = doc ? doc.categories : [];
    } else {
      src = state.kind === 'brand' ? state.meta.categories : state.meta.operatorCategories;
    }
    return (src || []).filter(function (c) { return c.count >= 3; }).slice(0, 16);
  }

  function renderFacets() {
    var list = facetList();
    var total;
    if (state.kind === 'brand' && state.scope) {
      var doc = scopedDoc();
      var country = scopeCountry();
      total = doc ? doc.brands.length : (country ? country.brands : 0);
    } else {
      total = state.kind === 'brand' ? (state.meta.stats.brands || 0) : (state.meta.stats.operators || 0);
    }
    var html = '<li><button type="button" class="chip' + (state.cat ? '' : ' on') + '" data-cat="">' + esc(t('all')) + ' <b>' + fmtNum(total) + '</b></button></li>';
    list.forEach(function (c) {
      html += '<li><button type="button" class="chip' + (state.cat === c.key ? ' on' : '') + '" data-cat="' + esc(c.key) + '">' +
        esc(catLabel(c.key)) + ' <b>' + fmtNum(c.count) + '</b></button></li>';
    });
    el.facets.innerHTML = html;
    el.facets.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        state.cat = b.dataset.cat;
        state.limit = PAGE;
        renderFacets();
        renderList();
      });
    });
  }

  function matches(item) {
    if (state.cat && !item.categories.some(function (c) { return c[0] === state.cat; })) return false;
    if (!state.query) return true;
    var q = state.query.toLowerCase();
    var hay = [item.name].concat(item.names || [], item.operators || [], item.brands || [], item.branches || [], item.cities || []);
    for (var i = 0; i < hay.length; i++) {
      if (hay[i] && String(hay[i]).toLowerCase().indexOf(q) !== -1) return true;
    }
    return false;
  }

  function filtered() {
    var out = items().filter(matches);
    var collator = new Intl.Collator(isEn() ? 'en' : 'zh-Hans-CN');
    out.sort(function (a, b) {
      if (state.sort === 'name') return collator.compare(a.name, b.name);
      if (state.sort === 'branches') return (b.branchCount || 0) - (a.branchCount || 0) || b.count - a.count;
      return b.count - a.count || collator.compare(a.name, b.name);
    });
    return out;
  }

  function subLine(item) {
    if (state.kind === 'brand') {
      if (item.operators && item.operators.length) {
        return t('opPrefix', { names: item.operators[0] }) +
          (item.operators.length > 1 ? t('operatorCountMore', { n: item.operators.length }) : '');
      }
      if (item.names && item.names.length) return item.names.join(' · ');
      if (item.cities && item.cities.length) return item.cities.slice(0, 3).join(' · ');
      return t('noOperator');
    }
    if (item.brands && item.brands.length) {
      return t('brandPrefix', { names: item.brands[0] }) +
        (item.brands.length > 1 ? t('brandCountMore', { n: item.brands.length }) : '');
    }
    if (item.networks && item.networks.length) return t('networkPrefix', { name: item.networks[0] });
    if (item.cities && item.cities.length) return item.cities.slice(0, 3).join(' · ');
    return t('noBrand');
  }

  function renderList() {
    var all = filtered();
    var shown = all.slice(0, state.limit);
    var max = all.length ? all[0].count : 1;
    if (state.sort === 'name') max = all.reduce(function (m, x) { return Math.max(m, x.count); }, 1);
    if (state.sort === 'branches') max = all.reduce(function (m, x) { return Math.max(m, x.count); }, 1);

    el.list.innerHTML = shown.map(function (item, i) {
      var cats = item.categories.slice(0, 3).map(function (c) {
        return '<span class="cat">' + esc(catLabel(c[0])) + '</span>';
      }).join('');
      if (item.categories.length > 3) cats += '<span class="cat">+' + (item.categories.length - 3) + '</span>';
      var pct = Math.max(4, Math.round((item.count / max) * 100));
      return '<li class="row"><button type="button" class="rowbtn" data-name="' + esc(item.name) + '">' +
        '<span class="rank">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="who"><span class="nm">' + esc(item.name) + '</span>' +
        '<span class="sub">' + esc(subLine(item)) + '</span></span>' +
        '<span class="cats">' + (cats || '<span class="cat">' + esc(t('uncategorised')) + '</span>') + '</span>' +
        '<span class="count"><span class="numb">' + fmtNum(item.count) + '</span>' +
        '<span class="bar"><i style="width:' + pct + '%"></i></span></span>' +
        '<span class="arrow">→</span></button></li>';
    }).join('');

    el.list.querySelectorAll('.rowbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        location.hash = detailHash(state.kind, b.dataset.name);
      });
    });

    el.showMore.hidden = all.length <= state.limit;
    el.showMore.textContent = t('showMore', { n: fmtNum(all.length - state.limit) });

    var parts = [t('entries', { n: fmtNum(all.length) })];
    if (state.kind === 'brand' && state.scope && scopeCountry()) parts.unshift(t('scopePrefix', { name: scopeCountry().name }));
    if (state.query) parts.push(t('queryPrefix', { q: state.query }));
    if (state.cat) parts.push(t('categoryPrefix', { name: catLabel(state.cat) }));
    el.resultCount.textContent = parts.join(' · ');
  }

  function syncCountrySelect() {
    var list = state.meta.countries || [];
    if (el.country.options.length !== list.length + 1) {
      el.country.innerHTML = '<option value="">' + esc(t('global')) + '</option>' + list.map(function (c) {
        var nm = c.name + (c.nameEn ? ' / ' + c.nameEn : '');
        return '<option value="' + esc(c.id) + '">' + esc(t('countryOption', { name: nm, n: fmtNum(c.elements) })) + '</option>';
      }).join('');
    }
    var scoped = state.kind === 'brand' && scopeCountry();
    el.country.value = scoped ? state.scope : '';
    el.country.disabled = state.kind !== 'brand';
    el.country.title = state.kind === 'brand' ? t('scopeTitle') : t('scopeTitleDisabled');
    updateTitle();
  }

  function renderIndex() {
    if (!state.meta) return;
    el.tabBrand.textContent = fmtNum(state.meta.stats.brands);
    el.tabOperator.textContent = fmtNum(state.meta.stats.operators);
    document.querySelectorAll('.segbtn').forEach(function (b) {
      var on = b.dataset.kind === state.kind;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    syncCountrySelect();
    renderFacets();

    if (state.kind === 'brand' && state.scope) {
      var country = scopeCountry();
      if (!country) {
        el.list.innerHTML = '';
        el.showMore.hidden = true;
        el.resultCount.textContent = '';
        el.loadInfo.textContent = '';
        setState('<p class="big">' + esc(t('countryMissing')) + '</p><p>' +
          esc(t('countryMissingBody', { id: state.route.scope || state.scope })) + '</p>' +
          '<p><a class="btn" href="#/">' + esc(t('backGlobal')) + '</a></p>', true);
        return;
      }
      if (!scopedDoc()) {
        el.list.innerHTML = '';
        el.showMore.hidden = true;
        el.resultCount.textContent = t('scopePrefix', { name: country.name });
        el.loadInfo.textContent = '';
        setState('<div class="skeleton"><span></span><span></span><span></span></div>' +
          esc(t('loadingScope', { name: country.name })), false);
        ensureScope(state.scope).then(function () {
          if (state.route.view === 'index' && state.scope === country.id) renderIndex();
        }).catch(function (err) {
          setState('<p class="big">' + esc(t('failedScope', { name: country.name })) + '</p><p>' + esc(err.message) + '</p>', true);
        });
        return;
      }
      setState('', false);
      renderList();
      updateLoadInfo();
      return;
    }

    if (!state.lists[state.kind]) {
      var kindPlural = t(state.kind === 'brand' ? 'brandsLower' : 'operatorsLower');
      el.list.innerHTML = '';
      el.showMore.hidden = true;
      el.resultCount.textContent = '';
      el.loadInfo.textContent = '';
      setState('<div class="skeleton"><span></span><span></span><span></span></div>' +
        esc(t('loadingList', { kind: kindPlural })), false);
      ensureList(state.kind).then(function () {
        if (state.route.view === 'index') renderIndex();
      }).catch(function (err) {
        setState('<p class="big">' + esc(t('failedList', { kind: kindPlural })) + '</p><p>' + esc(err.message) + '</p>', true);
      });
      return;
    }
    setState('', false);
    renderList();
    updateLoadInfo();
  }

  /* ---------- detail ---------- */
  function paintDetail(item, kind, scoped) {
    var cats = item.categories.map(function (c) {
      return '<span class="cat">' + esc(catLabel(c[0])) + ' <b style="font-family:var(--mono);font-weight:500;color:var(--muted)">' + fmtNum(c[1]) + '</b></span>';
    }).join('');

    var sub = [t('actualElements', { n: '<b>' + fmtNum(item.count) + '</b>' })];
    sub.push(t('actualBranches', { m: '<b>' + fmtNum(item.branchCount) + '</b>' }));
    if (item.operators.length) {
      sub.push(t('opPrefix', { names: '<b>' + esc(item.operators.slice(0, 2).join(t('namesJoin'))) + '</b>' }));
    }
    if (item.brands.length) {
      sub.push(t('brandPrefix', { names: '<b>' + esc(item.brands.slice(0, 2).join(t('namesJoin'))) + '</b>' }));
    }

    el.detailHead.innerHTML =
      '<p class="dmeta"><span class="tag">' + esc(t(kind === 'brand' ? 'brandFile' : 'operatorFile')) + '</span>' +
        (scoped ? '<span class="scopenote">' + esc(t('scopenote', { name: scoped.name })) + '</span>' : '') +
        '<span>' + esc(item.types.node || item.types.way ? Object.keys(item.types).filter(function (k) { return item.types[k]; }).map(function (k) { return k + ' ' + item.types[k]; }).join(' · ') : '—') + '</span>' +
        '<span>' + esc(t('snapElements', { n: fmtNum(item.count) })) + '</span>' +
      '</p>' +
      '<h1 id="dName">' + esc(item.name) + '</h1>' +
      '<p class="dsub">' + sub.join(' · ') + '</p>' +
      '<div class="dcats">' + (cats || '<span class="cat">' + esc(t('uncategorised')) + '</span>') + '</div>';

    el.backLink.href = indexHash(scoped ? scoped.id : '');

    var blocks = [];
    function chips(title, arr, total, more) {
      if (!arr || !arr.length) return;
      var html = '<h3>' + esc(title) + (total ? ' · ' + total : '') + '</h3><ul>';
      arr.forEach(function (v) { html += '<li>' + esc(v) + '</li>'; });
      if (more > 0) html += '<li class="more">+' + more + '</li>';
      blocks.push(html + '</ul>');
    }
    chips(t('chipsOperators'), item.operators, '', 0);
    chips(t('chipsBrands'), item.brands, '', 0);
    chips(t('chipsBranches'), item.branches,
      item.branchCount > item.branches.length ? t('branchesTotal', { n: item.branchCount }) : '',
      item.branchCount - item.branches.length);
    chips(t('chipsCities'), item.cities, '', 0);
    chips(t('chipsNetworks'), item.networks, '', 0);
    chips(t('chipsNames'), item.names.filter(function (n) { return n !== item.name; }), '', 0);
    if (!blocks.length) blocks.push('<p class="tagempty">' + esc(t('factsMore')) + '</p>');
    el.facts.innerHTML = blocks.join('');

    el.tagPanel.innerHTML = '<p class="tagempty">' + esc(t('tagPrompt')) + '</p>';
    el.mapMeta.textContent = t('querying');

    state.item = item;
    state.itemKind = kind;
    state.itemScope = scoped ? scoped.id : '';
  }

  function renderDetail(kind, name, scope) {
    if (!state.meta) return;
    var scoped = kind === 'brand' && scope ? scopeCountry() : null;
    if (kind === 'brand' && scope && !scoped) {
      state.item = null;
      el.detailHead.innerHTML = '<h1 id="dName">' + esc(name) + '</h1>';
      el.facts.innerHTML = '';
      el.elemList.innerHTML = '';
      el.mapMeta.textContent = '';
      renderMapState(t('missingScopeCountry', { id: scope }), true);
      el.elemNote.textContent = '';
      el.tagPanel.innerHTML = '<p class="tagempty">' + esc(t('noTags')) + '</p>';
      el.backLink.href = '#/';
      return;
    }

    var pool = null;
    if (kind === 'brand' && scope) {
      pool = scopedDoc() ? scopedDoc().brands : null;
    } else if (state.lists[kind]) {
      pool = state.lists[kind];
    }

    if (!pool) {
      state.item = null;
      el.detailHead.innerHTML = '<h1 id="dName">' + esc(name) + '</h1>';
      el.facts.innerHTML = '';
      el.elemList.innerHTML = '';
      el.mapMeta.textContent = '';
      el.elemNote.textContent = '';
      el.tagPanel.innerHTML = '<p class="tagempty">' + esc(t('loadingFile')) + '</p>';
      el.backLink.href = indexHash(scope);
      renderMapState(t('loadingFileState'), false);
      var pending = kind === 'brand' && scope ? ensureScope(scope) : ensureList(kind);
      pending.then(function () {
        if (state.route.view === 'detail' && state.route.name === name) renderDetail(kind, name, scope);
      }).catch(function (err) {
        renderMapState(t('failedFile', { kind: t(kind + 'Singular'), msg: err.message }), true);
      });
      return;
    }

    var item = pool.filter(function (x) { return x.name === name; })[0];
    if (!item) {
      state.item = null;
      el.detailHead.innerHTML = '';
      el.facts.innerHTML = '';
      el.elemList.innerHTML = '';
      el.mapMeta.textContent = '';
      renderMapState(t('brandMissing', {
        name: name,
        scope: scoped ? t('missingScopeSuffix', { name: scoped.name }) : ''
      }), true);
      el.elemNote.textContent = '';
      el.tagPanel.innerHTML = '<p class="tagempty">' + esc(t('noTags')) + '</p>';
      el.backLink.href = indexHash(scope);
      return;
    }

    paintDetail(item, kind, scoped);

    el.elemList.innerHTML = '';
    el.elemNote.textContent = '';
    state.mapInfo = null;
    renderMapState(scoped
      ? t('mapQuerying', { kind: t(kind + 'Singular'), scope: scoped.name })
      : t('mapQueryingGlobal', { kind: t(kind + 'Singular') }), false);
    var areaId = scoped ? (scoped.areaId || 3600000000 + Number(scoped.id)) : 0;
    fetchDetail(kind, item.name, areaId);
  }

  function renderMapState(text, isError) {
    if (!text) { el.mapState.hidden = true; el.mapState.textContent = ''; return; }
    el.mapState.hidden = false;
    el.mapState.textContent = text;
    el.mapState.style.background = isError ? 'rgba(178,58,30,.94)' : 'rgba(25,24,19,.9)';
  }

  function buildQuery(kind, name, areaId) {
    var v = escQl(name);
    var area = areaId ? '(area:' + areaId + ')' : '';
    var body;
    if (kind === 'brand') {
      body = [
        'node["brand"="' + v + '"]' + area + ';',
        'way["brand"="' + v + '"]' + area + ';',
        'relation["brand"="' + v + '"]' + area + ';'
      ].join('\n');
    } else {
      body = OP_FILTERS.map(function (f) {
        return f[0] + '["operator"="' + v + '"]["' + f[1] + '"]' + area + ';';
      }).join('\n');
    }
    return '[out:json][timeout:60];\n(\n' + body + '\n)->.a;\n.a out count;\n.a out center ' + MAX_MARKERS + ';';
  }

  function fetchDetail(kind, name, areaId) {
    var token = ++state.token;
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT);
    state.elements = [];
    state.selected = null;

    fetch(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(buildQuery(kind, name, areaId)),
      signal: controller.signal
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (json) {
      clearTimeout(timer);
      if (token !== state.token) return;
      var parsed = parseResult(json);
      renderMap(parsed, kind);
    }).catch(function (err) {
      clearTimeout(timer);
      if (token !== state.token) return;
      var msg = err && err.name === 'AbortError'
        ? t('abort', { s: Math.round(FETCH_TIMEOUT / 1000) })
        : t('failQuery', { msg: (err && err.message) || t('netError') });
      renderMapState(msg + t('retryHint'), true);
      el.mapMeta.textContent = t('queryFailed');
      el.elemNote.textContent = '';
    });
  }

  function parseResult(json) {
    var count = null, els = [];
    (json.elements || []).forEach(function (e) {
      if (e.type === 'count') { count = parseInt(e.tags && e.tags.total, 10); return; }
      var lat = e.lat != null ? e.lat : (e.center && e.center.lat);
      var lon = e.lon != null ? e.lon : (e.center && e.center.lon);
      if (lat == null || lon == null) return;
      els.push({ type: e.type, id: e.id, lat: lat, lon: lon, tags: e.tags || {} });
    });
    return { count: count, elements: els };
  }

  function ensureMap() {
    if (state.map) return state.map;
    state.map = L.map('map', {
      center: [20, 10], zoom: 2, minZoom: 2, maxZoom: 18,
      preferCanvas: true, worldCopyJump: false, zoomControl: true, attributionControl: true
    });
    state.map.attributionControl.setPrefix('');
    state.tile = L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution: '<a href="' + OGF + '/" target="_blank" rel="noopener">' + esc(t('attribution')) + '</a> · ODbL'
    }).addTo(state.map);
    state.layer = L.featureGroup().addTo(state.map);
    return state.map;
  }

  function elementTitle(e) {
    var tags = e.tags;
    return tags.name || tags['name:en'] || tags.branch || tags.operator || tags.brand || catLabelOfTags(tags) || t('unnamed');
  }
  function catLabelOfTags(t) {
    var keys = ['shop', 'amenity', 'tourism', 'office', 'craft', 'leisure', 'healthcare', 'public_transport', 'railway', 'highway'];
    for (var i = 0; i < keys.length; i++) if (t[keys[i]]) return catLabel(keys[i] + '=' + t[keys[i]]);
    return '';
  }

  function popupHtml(e) {
    return '<p class="pop-name">' + esc(elementTitle(e)) + '</p>' +
      '<p class="pop-meta">' + esc(e.type + ' #' + e.id) + (catLabelOfTags(e.tags) ? ' · ' + esc(catLabelOfTags(e.tags)) : '') +
      (e.tags.branch ? '<br>' + esc(e.tags.branch) : '') + '</p>' +
      '<p class="pop-link"><a href="' + OGF + '/' + e.type + '/' + e.id + '" target="_blank" rel="noopener">' + esc(t('openInOgfShort')) + '</a></p>';
  }

  function renderMap(parsed, kind) {
    var map = ensureMap();
    map.invalidateSize();
    state.layer.clearLayers();
    state.markers = {};
    state.elements = parsed.elements;

    parsed.elements.forEach(function (e) {
      var m = L.circleMarker([e.lat, e.lon], {
        radius: 5.5, color: '#FDFBF4', weight: 1.4, fillColor: '#B23A1E', fillOpacity: 0.92
      });
      m.bindPopup(popupHtml(e), { maxWidth: 260 });
      m.on('click', function () { selectElement(e); });
      m.addTo(state.layer);
      state.markers[e.type + '/' + e.id] = m;
    });

    if (parsed.elements.length) {
      var b = state.layer.getBounds();
      if (b.isValid()) map.fitBounds(b.pad(0.18), { maxZoom: 7, animate: false });
    } else {
      map.setView([20, 10], 2, { animate: false });
    }

    var shown = parsed.elements.length;
    var total = parsed.count == null ? shown : parsed.count;
    state.mapInfo = { total: total, shown: shown };
    updateMapTexts();

    if (!shown) {
      renderMapState(t('mapNoCoords'), false);
    } else {
      renderMapState('', false);
    }

    renderElementList();
  }

  function updateMapTexts() {
    var info = state.mapInfo;
    if (!info) return;
    var truncated = info.total > info.shown;
    el.mapMeta.textContent = t('mapMeta', {
      total: fmtNum(info.total),
      shown: fmtNum(info.shown),
      more: truncated ? t('mapTruncated') : ''
    });
    el.mapMeta.title = truncated ? t('mapTruncTitle', { n: MAX_MARKERS }) : '';
    el.elemNote.textContent = t('elemNote', {
      total: fmtNum(info.total),
      more: truncated ? t('elemNoteMore', { shown: fmtNum(info.shown) }) : ''
    });
    if (!info.shown && !el.mapState.hidden) renderMapState(t('mapNoCoords'), false);
  }

  function renderElementList() {
    var sorted = state.elements.slice().sort(function (a, b) {
      var an = elementTitle(a).toLowerCase(), bn = elementTitle(b).toLowerCase();
      return an < bn ? -1 : an > bn ? 1 : 0;
    });
    el.elemList.innerHTML = sorted.map(function (e) {
      var tags = e.tags;
      var sub = [tags.branch, tags['addr:city'] || tags['addr:street'], catLabelOfTags(tags)].filter(Boolean).join(' · ');
      return '<li><button type="button" class="elembtn" data-key="' + esc(e.type + '/' + e.id) + '">' +
        '<span class="eid">' + esc(e.type) + ' ' + e.id + '</span>' +
        '<span class="etitle"><b>' + esc(elementTitle(e)) + '</b>' +
        (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span>' +
        '<span class="ecat">' + esc(catLabelOfTags(tags) || '—') + '</span></button></li>';
    }).join('');
    el.elemList.querySelectorAll('.elembtn').forEach(function (b) {
      b.classList.toggle('on', b.dataset.key === state.selected);
      b.addEventListener('click', function () {
        var key = b.dataset.key;
        var e = state.elements.filter(function (x) { return x.type + '/' + x.id === key; })[0];
        if (e) selectElement(e);
      });
    });
  }

  function selectElement(e) {
    state.selected = e.type + '/' + e.id;
    el.elemList.querySelectorAll('.elembtn').forEach(function (b) {
      b.classList.toggle('on', b.dataset.key === state.selected);
    });
    var m = state.markers[state.selected];
    if (m) {
      m.setRadius(8);
      m.setStyle({ fillColor: '#191813' });
      state.map.panTo([e.lat, e.lon], { animate: true, duration: 0.4 });
      m.openPopup();
    }
    Object.keys(state.markers).forEach(function (k) {
      if (k !== state.selected) {
        state.markers[k].setRadius(5.5);
        state.markers[k].setStyle({ fillColor: '#B23A1E' });
      }
    });
    renderTags(e);
    var row = el.elemList.querySelector('.elembtn.on');
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function renderTags(e) {
    var tags = e.tags;
    var keys = Object.keys(tags).sort(function (a, b) {
      if (a === 'name') return -1;
      if (b === 'name') return 1;
      return a.localeCompare(b);
    });
    var rows = keys.map(function (k) {
      return '<div class="tagrow"><dt>' + esc(k) + '</dt><dd>' + esc(tags[k]) + '</dd></div>';
    }).join('');
    el.tagPanel.innerHTML =
      '<h3>' + esc(elementTitle(e)) + '</h3>' +
      '<span class="tagsub">' + esc(e.type + ' #' + e.id + ' · ' + e.lat.toFixed(5) + ', ' + e.lon.toFixed(5)) + '</span>' +
      (rows ? '<dl style="margin:0">' + rows + '</dl>' : '<p class="tagempty">' + esc(t('tagEmpty')) + '</p>') +
      '<a class="ogflink" href="' + OGF + '/' + e.type + '/' + e.id + '" target="_blank" rel="noopener">' + esc(t('openInOgf', { id: e.type + '/' + e.id })) + '</a>';
  }

  /* ---------- events ---------- */
  el.q.addEventListener('input', function () {
    state.query = el.q.value.trim();
    state.limit = PAGE;
    renderList();
  });
  el.sort.addEventListener('change', function () {
    state.sort = el.sort.value;
    state.limit = PAGE;
    renderList();
  });
  el.showMore.addEventListener('click', function () {
    state.limit += PAGE;
    renderList();
  });
  document.querySelectorAll('.segbtn').forEach(function (b) {
    b.addEventListener('click', function () {
      if (state.kind === b.dataset.kind) return;
      var keep = state.scope;
      state.kind = b.dataset.kind;
      state.scope = b.dataset.kind === 'brand' ? keep : '';
      state.cat = '';
      state.limit = PAGE;
      var want = indexHash(state.scope);
      if (location.hash !== want) location.hash = want;
      else renderIndex();
    });
  });
  el.country.addEventListener('change', function () {
    if (state.kind !== 'brand') return;
    var id = el.country.value;
    state.cat = '';
    state.limit = PAGE;
    var want = indexHash(id);
    if (location.hash !== want) location.hash = want;
    else if (state.scope !== id) { state.scope = id; renderIndex(); }
  });
  window.addEventListener('hashchange', render);
  document.querySelectorAll('.langbtn').forEach(function (b) {
    b.addEventListener('click', function () {
      var lang = b.getAttribute('data-lang');
      if (lang === LANG) return;
      setLang(lang);
    });
  });

  /* ---------- boot ---------- */
  function setState(html, isError) {
    el.state.className = 'state' + (isError ? ' err' : '');
    el.state.innerHTML = html;
  }

  function load() {
    setState('<div class="skeleton"><span></span><span></span><span></span></div>', false);
    fetch('data/meta.json').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (meta) {
      state.meta = meta;
      setState('', false);
      var s = meta.stats || {};
      el.statBrands.textContent = fmtNum(s.brands);
      el.statOperators.textContent = fmtNum(s.operators);
      el.statElements.textContent = fmtNum(s.brandElements);
      el.statBranches.textContent = fmtNum(s.operatorElements);
      updateStamps();
      render();
    }).catch(function (err) {
      setState('<p class="big">' + esc(t('loadFailed')) + '</p><p>' + esc(t('loadFailedBody', { msg: err.message })) + '</p>' +
        '<button type="button" class="btn" id="retryLoad">' + esc(t('retry')) + '</button>', true);
      var b = document.getElementById('retryLoad');
      if (b) b.addEventListener('click', load);
    });
  }

  applyStaticLang();
  load();
})();
