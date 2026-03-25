import {
	Button,
	Card,
	Col,
	DatePicker,
	Divider,
	Form,
	Input,
	InputNumber,
	message,
	Row,
	Select,
	Space,
	Table,
	Tabs,
	Tag,
} from 'antd';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import DynamicFieldInputs from './components/DynamicFieldInputs';
import {
	createDynamicField,
	createQuyetDinh,
	createSoVanBang,
	createVanBang,
	loadState,
	persistState,
	searchVanBang,
} from './storage';
import type { DynamicField, SearchPayload, TH04State, VanBangRecord } from './types';

const TH04 = () => {
	const [state, setState] = useState<TH04State>(loadState());
	const [searchData, setSearchData] = useState<VanBangRecord[]>(state.vanBangs);

	const [formSo] = Form.useForm();
	const [formQd] = Form.useForm();
	const [formField] = Form.useForm();
	const [formVanBang] = Form.useForm();
	const [formSearch] = Form.useForm();

	useEffect(() => {
		persistState(state);
		setSearchData(state.vanBangs);
	}, [state]);

	const soMap = useMemo(
		() => Object.fromEntries(state.soVanBangs.map((item) => [item.id, item])),
		[state.soVanBangs],
	);

	const qdMap = useMemo(
		() => Object.fromEntries(state.quyetDinhs.map((item) => [item.id, item])),
		[state.quyetDinhs],
	);

	const onCreateSo = (values: { nam: number; maSo: string; ngayMoSo: moment.Moment }) => {
		try {
			setState((prev) =>
				createSoVanBang(prev, {
					nam: Number(values.nam),
					maSo: values.maSo,
					ngayMoSo: values.ngayMoSo.format('YYYY-MM-DD'),
				}),
			);
			formSo.resetFields();
			message.success('Da tao so van bang');
		} catch (error: unknown) {
			message.error((error as Error).message || 'Tao so that bai');
		}
	};

	const onCreateQd = (values: {
		soQD: string;
		ngayBanHanh: moment.Moment;
		trichYeu: string;
		soVanBangId: string;
	}) => {
		try {
			setState((prev) =>
				createQuyetDinh(prev, {
					soQD: values.soQD,
					ngayBanHanh: values.ngayBanHanh.format('YYYY-MM-DD'),
					trichYeu: values.trichYeu,
					soVanBangId: values.soVanBangId,
				}),
			);
			formQd.resetFields();
			message.success('Da tao quyet dinh');
		} catch (error: unknown) {
			message.error((error as Error).message || 'Tao quyet dinh that bai');
		}
	};

	const onCreateField = (values: Omit<DynamicField, 'id'>) => {
		try {
			setState((prev) =>
				createDynamicField(prev, {
					id: '',
					...values,
				}),
			);
			formField.resetFields();
			message.success('Da them truong dong');
		} catch (error: unknown) {
			message.error((error as Error).message || 'Them truong that bai');
		}
	};

	const onCreateVanBang = (values: {
		soVanBangId: string;
		quyetDinhId: string;
		soHieuVanBang: string;
		maSinhVien: string;
		hoTen: string;
		ngaySinh: moment.Moment;
		dynamicValues?: Record<string, unknown>;
	}) => {
		try {
			let nextSoVaoSo = 1;
			setState((prev) => {
				const nextState = createVanBang(prev, {
					soVanBangId: values.soVanBangId,
					quyetDinhId: values.quyetDinhId,
					soHieuVanBang: values.soHieuVanBang,
					maSinhVien: values.maSinhVien,
					hoTen: values.hoTen,
					ngaySinh: values.ngaySinh.format('YYYY-MM-DD'),
					dynamicValues: values.dynamicValues || {},
				});
				nextSoVaoSo = nextState.vanBangs[0]?.soVaoSo || 1;
				return nextState;
			});
			formVanBang.resetFields();
			message.success(`Da them van bang, so vao so: ${nextSoVaoSo}`);
		} catch (error: unknown) {
			message.error((error as Error).message || 'Them van bang that bai');
		}
	};

	const onSearch = (values: {
		soHieuVanBang?: string;
		soVaoSo?: number;
		maSinhVien?: string;
		hoTen?: string;
		ngaySinh?: moment.Moment;
	}) => {
		const payload: SearchPayload = {
			soHieuVanBang: values.soHieuVanBang,
			soVaoSo: values.soVaoSo,
			maSinhVien: values.maSinhVien,
			hoTen: values.hoTen,
			ngaySinh: values.ngaySinh ? values.ngaySinh.format('YYYY-MM-DD') : undefined,
		};

		try {
			const rows = searchVanBang(state, payload);
			setSearchData(rows);
			message.success(`Tim thay ${rows.length} ket qua`);
		} catch (error: unknown) {
			message.error((error as Error).message || 'Tra cuu that bai');
		}
	};

	const soOptions = state.soVanBangs.map((item) => ({
		label: `${item.maSo} (${item.nam})`,
		value: item.id,
	}));

	const qdOptions = state.quyetDinhs.map((item) => ({
		label: `${item.soQD} - ${item.trichYeu}`,
		value: item.id,
	}));

	return (
		<Card title='TH04 - Quan ly so van bang tot nghiep'>
			<Tabs defaultActiveKey='so'>
				<Tabs.TabPane tab='So van bang' key='so'>
					<Row gutter={16}>
						<Col span={8}>
							<Card size='small' title='Them so van bang'>
								<Form form={formSo} layout='vertical' onFinish={onCreateSo}>
									<Form.Item name='nam' label='Nam' rules={[{ required: true, message: 'Vui long nhap nam' }]}>
										<InputNumber style={{ width: '100%' }} min={2000} max={2100} />
									</Form.Item>
									<Form.Item name='maSo' label='Ma so' rules={[{ required: true, message: 'Vui long nhap ma so' }]}>
										<Input placeholder='VD: SVB-2026' />
									</Form.Item>
									<Form.Item
										name='ngayMoSo'
										label='Ngay mo so'
										rules={[{ required: true, message: 'Vui long chon ngay mo so' }]}
									>
										<DatePicker style={{ width: '100%' }} format='DD/MM/YYYY' />
									</Form.Item>
									<Button type='primary' htmlType='submit' block>
										Tao so
									</Button>
								</Form>
							</Card>
						</Col>
						<Col span={16}>
							<Table
								rowKey='id'
								pagination={false}
								dataSource={state.soVanBangs}
								columns={[
									{ title: 'Nam', dataIndex: 'nam', width: 120 },
									{ title: 'Ma so', dataIndex: 'maSo', width: 180 },
									{ title: 'Ngay mo so', dataIndex: 'ngayMoSo' },
								]}
							/>
						</Col>
					</Row>
				</Tabs.TabPane>

				<Tabs.TabPane tab='Quyet dinh tot nghiep' key='qd'>
					<Row gutter={16}>
						<Col span={8}>
							<Card size='small' title='Them quyet dinh'>
								<Form form={formQd} layout='vertical' onFinish={onCreateQd}>
									<Form.Item
										name='soQD'
										label='So quyet dinh'
										rules={[{ required: true, message: 'Vui long nhap so quyet dinh' }]}
									>
										<Input />
									</Form.Item>
									<Form.Item
										name='ngayBanHanh'
										label='Ngay ban hanh'
										rules={[{ required: true, message: 'Vui long chon ngay ban hanh' }]}
									>
										<DatePicker style={{ width: '100%' }} format='DD/MM/YYYY' />
									</Form.Item>
									<Form.Item
										name='trichYeu'
										label='Trich yeu'
										rules={[{ required: true, message: 'Vui long nhap trich yeu' }]}
									>
										<Input.TextArea rows={3} />
									</Form.Item>
									<Form.Item
										name='soVanBangId'
										label='Thuoc so van bang'
										rules={[{ required: true, message: 'Vui long chon so van bang' }]}
									>
										<Select options={soOptions} />
									</Form.Item>
									<Button type='primary' htmlType='submit' block>
										Tao quyet dinh
									</Button>
								</Form>
							</Card>
						</Col>
						<Col span={16}>
							<Table
								rowKey='id'
								pagination={false}
								dataSource={state.quyetDinhs}
								columns={[
									{ title: 'So quyet dinh', dataIndex: 'soQD', width: 170 },
									{ title: 'Ngay ban hanh', dataIndex: 'ngayBanHanh', width: 150 },
									{ title: 'Trich yeu', dataIndex: 'trichYeu' },
									{
										title: 'So van bang',
										render: (_, record) =>
											`${soMap[record.soVanBangId]?.maSo || '-'} (${soMap[record.soVanBangId]?.nam || '-'})`,
									},
								]}
							/>
						</Col>
					</Row>
				</Tabs.TabPane>

				<Tabs.TabPane tab='Cau hinh bieu mau' key='field'>
					<Row gutter={16}>
						<Col span={8}>
							<Card size='small' title='Them truong dong'>
								<Form form={formField} layout='vertical' onFinish={onCreateField} initialValues={{ required: false }}>
									<Form.Item name='key' label='Key' rules={[{ required: true, message: 'Vui long nhap key' }]}>
										<Input placeholder='VD: diemTrungBinh' />
									</Form.Item>
									<Form.Item name='label' label='Ten hien thi' rules={[{ required: true, message: 'Vui long nhap nhan' }]}>
										<Input placeholder='VD: Diem trung binh' />
									</Form.Item>
									<Form.Item
										name='dataType'
										label='Kieu du lieu'
										rules={[{ required: true, message: 'Vui long chon kieu du lieu' }]}
									>
										<Select
											options={[
												{ label: 'STRING', value: 'STRING' },
												{ label: 'NUMBER', value: 'NUMBER' },
												{ label: 'DATE', value: 'DATE' },
											]}
										/>
									</Form.Item>
									<Form.Item name='required' label='Bat buoc'>
										<Select
											options={[
												{ label: 'Khong', value: false },
												{ label: 'Co', value: true },
											]}
										/>
									</Form.Item>
									<Button type='primary' htmlType='submit' block>
										Them truong
									</Button>
								</Form>
							</Card>
						</Col>
						<Col span={16}>
							<Table
								rowKey='id'
								pagination={false}
								dataSource={state.dynamicFields}
								columns={[
									{ title: 'Key', dataIndex: 'key', width: 180 },
									{ title: 'Ten hien thi', dataIndex: 'label', width: 240 },
									{ title: 'Kieu', dataIndex: 'dataType', width: 120, render: (value) => <Tag color='blue'>{value}</Tag> },
									{ title: 'Bat buoc', dataIndex: 'required', render: (value) => (value ? 'Co' : 'Khong') },
								]}
							/>
						</Col>
					</Row>
				</Tabs.TabPane>

				<Tabs.TabPane tab='Thong tin van bang' key='vanbang'>
					<Row gutter={16}>
						<Col span={10}>
							<Card size='small' title='Them van bang'>
								<Form form={formVanBang} layout='vertical' onFinish={onCreateVanBang}>
									<Form.Item
										name='soVanBangId'
										label='So van bang'
										rules={[{ required: true, message: 'Vui long chon so van bang' }]}
									>
										<Select options={soOptions} />
									</Form.Item>
									<Form.Item
										name='quyetDinhId'
										label='Quyet dinh tot nghiep'
										rules={[{ required: true, message: 'Vui long chon quyet dinh' }]}
									>
										<Select options={qdOptions} />
									</Form.Item>
									<Form.Item
										name='soHieuVanBang'
										label='So hieu van bang'
										rules={[{ required: true, message: 'Vui long nhap so hieu van bang' }]}
									>
										<Input />
									</Form.Item>
									<Form.Item
										name='maSinhVien'
										label='Ma sinh vien'
										rules={[{ required: true, message: 'Vui long nhap ma sinh vien' }]}
									>
										<Input />
									</Form.Item>
									<Form.Item name='hoTen' label='Ho ten' rules={[{ required: true, message: 'Vui long nhap ho ten' }]}>
										<Input />
									</Form.Item>
									<Form.Item
										name='ngaySinh'
										label='Ngay sinh'
										rules={[{ required: true, message: 'Vui long chon ngay sinh' }]}
									>
										<DatePicker style={{ width: '100%' }} format='DD/MM/YYYY' />
									</Form.Item>

									<Divider orientation='left'>Truong dong theo cau hinh</Divider>
									<DynamicFieldInputs fields={state.dynamicFields} />

									<Button type='primary' htmlType='submit' block>
										Tao van bang
									</Button>
								</Form>
							</Card>
						</Col>
						<Col span={14}>
							<Table
								rowKey='id'
								dataSource={state.vanBangs}
								pagination={{ pageSize: 5 }}
								columns={[
									{ title: 'So vao so', dataIndex: 'soVaoSo', width: 110 },
									{ title: 'So hieu', dataIndex: 'soHieuVanBang', width: 150 },
									{ title: 'MSV', dataIndex: 'maSinhVien', width: 120 },
									{ title: 'Ho ten', dataIndex: 'hoTen', width: 180 },
									{ title: 'Ngay sinh', dataIndex: 'ngaySinh', width: 120 },
									{ title: 'So', width: 140, render: (_, record) => soMap[record.soVanBangId]?.maSo || '-' },
									{ title: 'Quyet dinh', width: 140, render: (_, record) => qdMap[record.quyetDinhId]?.soQD || '-' },
									{
										title: 'Truong dong',
										render: (_, record) => {
											const entries = Object.entries(record.dynamicValues);
											if (!entries.length) return '-';
											return entries.map(([key, value]) => <Tag key={key}>{`${key}: ${value}`}</Tag>);
										},
									},
								]}
							/>
						</Col>
					</Row>
				</Tabs.TabPane>

				<Tabs.TabPane tab='Tra cuu van bang' key='search'>
					<Card size='small' title='Nhap toi thieu 2 tham so de tra cuu'>
						<Form form={formSearch} layout='vertical' onFinish={onSearch}>
							<Row gutter={12}>
								<Col span={6}>
									<Form.Item name='soHieuVanBang' label='So hieu van bang'>
										<Input />
									</Form.Item>
								</Col>
								<Col span={4}>
									<Form.Item name='soVaoSo' label='So vao so'>
										<InputNumber style={{ width: '100%' }} />
									</Form.Item>
								</Col>
								<Col span={5}>
									<Form.Item name='maSinhVien' label='Ma sinh vien'>
										<Input />
									</Form.Item>
								</Col>
								<Col span={5}>
									<Form.Item name='hoTen' label='Ho ten'>
										<Input />
									</Form.Item>
								</Col>
								<Col span={4}>
									<Form.Item name='ngaySinh' label='Ngay sinh'>
										<DatePicker style={{ width: '100%' }} format='DD/MM/YYYY' />
									</Form.Item>
								</Col>
							</Row>
							<Space>
								<Button type='primary' htmlType='submit'>
									Tra cuu
								</Button>
								<Button
									onClick={() => {
										formSearch.resetFields();
										setSearchData(state.vanBangs);
									}}
								>
									Xoa loc
								</Button>
							</Space>
						</Form>
					</Card>

					<Divider />

					<Table
						rowKey='id'
						dataSource={searchData}
						pagination={{ pageSize: 8 }}
						columns={[
							{ title: 'So vao so', dataIndex: 'soVaoSo', width: 110 },
							{ title: 'So hieu van bang', dataIndex: 'soHieuVanBang', width: 170 },
							{ title: 'Ma sinh vien', dataIndex: 'maSinhVien', width: 130 },
							{ title: 'Ho ten', dataIndex: 'hoTen', width: 180 },
							{ title: 'Ngay sinh', dataIndex: 'ngaySinh', width: 120 },
							{ title: 'Quyet dinh', render: (_, record) => qdMap[record.quyetDinhId]?.soQD || '-' },
						]}
					/>
				</Tabs.TabPane>
			</Tabs>
		</Card>
	);
};

export default TH04;
