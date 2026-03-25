export default [
	{
		path: '/user',
		layout: false,
		routes: [
			{
				path: '/user/login',
				layout: false,
				name: 'login',
				component: './user/Login',
			},
			{
				path: '/user',
				redirect: '/user/login',
			},
		],
	},

	///////////////////////////////////
	// DEFAULT MENU
	{
		path: '/dashboard',
		name: 'Dashboard',
		component: './TrangChu',
		icon: 'HomeOutlined',
	},
	{
		path: '/gioi-thieu',
		name: 'About',
		component: './TienIch/GioiThieu',
		hideInMenu: true,
	},
	{
		path: '/random-user',
		name: 'RandomUser',
		component: './RandomUser',
		icon: 'ArrowsAltOutlined',
	},
	{
		path: '/todo-list',
		name: 'TodoList',
		icon: 'OrderedListOutlined',
		component: './TodoList',
	},

	{ 
		path: '/th01',
		name: 'TH01',
		icon: 'ExperimentOutlined',
		routes: [
			{
				path: 'guess-number',
				name: 'Đoán Số',
				component: './TH01/GuessThenum',
			},
			{
				path: 'theo-doi-hoc-tap',
				name: 'Theo Dõi Học Tập',
				component: './TH01/Theodoihoctap',
				
			}
		],
	},

	{
		path: '/th02',
		name: 'TH02',
		icon: 'ExperimentOutlined',
		routes: [
			{
				path: 'oan-tu-ti',
				name: 'Oẳn Tù Tì',
				component: './TH02/Oantuti',
			},

			{
				path: 'quan-li-ngan-hang',
				name: 'Quản Lí Ngân Hàng',
				component: './TH02/Quanlinganhang',
				
			}

		],
	},

	{
		path: '/th03',
		name: 'TH03',
		icon: 'ExperimentOutlined',
		routes: [
			{
				path: 'quan-li-dat-lich',
				name: 'Quản Lý Đặt Lịch',
				component: './TH03',
			}
		]
	},
	{
		path: '/th04',
		name: 'TH04',
		icon: 'ExperimentOutlined',
		routes: [
			{
				path: 'quan-li-van-bang',
				name: 'Quản Lý Văn Bằng',
				component: './TH04',
			},
		],
	},

	


	
	// DANH MUC HE THONG
	// {
	// 	name: 'DanhMuc',
	// 	path: '/danh-muc',
	// 	icon: 'copy',
	// 	routes: [
	// 		{
	// 			name: 'ChucVu',
	// 			path: 'chuc-vu',
	// 			component: './DanhMuc/ChucVu',
	// 		},
	// 	],
	// },

	{
		path: '/notification',
		routes: [
			{
				path: './subscribe',
				exact: true,
				component: './ThongBao/Subscribe',
			},
			{
				path: './check',
				exact: true,
				component: './ThongBao/Check',
			},
			{
				path: './',
				exact: true,
				component: './ThongBao/NotifOneSignal',
			},
		],
		layout: false,
		hideInMenu: true,
	},
	{
		path: '/',
	},
	{
		path: '/403',
		component: './exception/403/403Page',
		layout: false,
	},
	{
		path: '/hold-on',
		component: './exception/DangCapNhat',
		layout: false,
	},
	{
		component: './exception/404',
	},
];
