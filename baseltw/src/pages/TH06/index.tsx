import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Upload,
  message,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import ReactApexChart from 'react-apexcharts';
import moment from 'moment';

type DestinationType = 'BEACH' | 'MOUNTAIN' | 'CITY';

interface Destination {
  id: string;
  name: string;
  location: string;
  type: DestinationType;
  rating: number;
  imageUrl: string;
  description: string;
  visitHours: number;
  costFood: number;
  costStay: number;
  costTransport: number;
}

interface DayPlan {
  day: string; // YYYY-MM-DD
  destinationIds: string[];
}

interface TripHistory {
  id: string;
  createdAt: string;
  destinationIds: string[];
  total: number;
  food: number;
  stay: number;
  transport: number;
}

interface AppState {
  destinations: Destination[];
  dayPlans: DayPlan[];
  tripHistory: TripHistory[];
  budgetLimit: number;
}

const STORAGE_KEY = 'th06-travel-simple-v1';
const uid = () => Math.random().toString(36).slice(2, 10);

const seed = (): AppState => ({
  destinations: [
    {
      id: uid(),
      name: 'Da Nang Beach',
      location: 'Da Nang',
      type: 'BEACH',
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      description: 'Beautiful beach city',
      visitHours: 4,
      costFood: 250000,
      costStay: 500000,
      costTransport: 200000,
    },
    {
      id: uid(),
      name: 'Sapa',
      location: 'Lao Cai',
      type: 'MOUNTAIN',
      rating: 4.6,
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
      description: 'Mountain landscape',
      visitHours: 5,
      costFood: 220000,
      costStay: 450000,
      costTransport: 350000,
    },
    {
      id: uid(),
      name: 'Ho Chi Minh City',
      location: 'HCM',
      type: 'CITY',
      rating: 4.4,
      imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      description: 'Dynamic city tour',
      visitHours: 6,
      costFood: 300000,
      costStay: 600000,
      costTransport: 180000,
    },
  ],
  dayPlans: [],
  tripHistory: [],
  budgetLimit: 5000000,
});

const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw);
  } catch {
    return seed();
  }
};

const saveState = (s: AppState) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

const toBase64 = (file: File) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });

const TH06Simple: React.FC = () => {
  const [state, setState] = useState<AppState>(loadState());
  const [adminForm] = Form.useForm();

  const [filterType, setFilterType] = useState<'ALL' | DestinationType>('ALL');
  const [maxCost, setMaxCost] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<'rating' | 'cost'>('rating');

  const [selectedDay, setSelectedDay] = useState<string>(moment().format('YYYY-MM-DD'));
  const [destinationToAdd, setDestinationToAdd] = useState<string>();
  const [adminModal, setAdminModal] = useState<{ open: boolean; editId?: string }>({ open: false });

  const persist = (next: AppState) => {
    setState(next);
    saveState(next);
  };

  const filteredDestinations = useMemo(() => {
    let data = [...state.destinations];
    if (filterType !== 'ALL') data = data.filter((d) => d.type === filterType);
    if (maxCost) {
      data = data.filter((d) => d.costFood + d.costStay + d.costTransport <= maxCost);
    }
    if (sortBy === 'rating') data.sort((a, b) => b.rating - a.rating);
    else data.sort((a, b) => a.costFood + a.costStay + a.costTransport - (b.costFood + b.costStay + b.costTransport));
    return data;
  }, [state.destinations, filterType, maxCost, sortBy]);

  const dayPlan = state.dayPlans.find((d) => d.day === selectedDay);
  const plannedDestinations = (dayPlan?.destinationIds || [])
    .map((id) => state.destinations.find((d) => d.id === id))
    .filter(Boolean) as Destination[];

  const budget = useMemo(() => {
    const food = plannedDestinations.reduce((s, d) => s + d.costFood, 0);
    const stay = plannedDestinations.reduce((s, d) => s + d.costStay, 0);
    const transport = plannedDestinations.reduce((s, d) => s + d.costTransport, 0);
    const total = food + stay + transport;
    // simple travel-time estimation
    const moveHours = Math.max(0, plannedDestinations.length - 1) * 1.5;
    const visitHours = plannedDestinations.reduce((s, d) => s + d.visitHours, 0);
    return { food, stay, transport, total, moveHours, visitHours, overallHours: moveHours + visitHours };
  }, [plannedDestinations]);

  const addDestinationToDay = () => {
    if (!destinationToAdd) return;
    const existed = state.dayPlans.find((d) => d.day === selectedDay);
    let nextDayPlans = [...state.dayPlans];
    if (!existed) {
      nextDayPlans.push({ day: selectedDay, destinationIds: [destinationToAdd] });
    } else {
      nextDayPlans = nextDayPlans.map((d) =>
        d.day === selectedDay ? { ...d, destinationIds: [...d.destinationIds, destinationToAdd] } : d,
      );
    }
    persist({ ...state, dayPlans: nextDayPlans });
    setDestinationToAdd(undefined);
  };

  const removeFromDay = (id: string) => {
    const next = state.dayPlans.map((d) =>
      d.day === selectedDay ? { ...d, destinationIds: d.destinationIds.filter((x) => x !== id) } : d,
    );
    persist({ ...state, dayPlans: next });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    if (!dayPlan) return;
    const arr = [...dayPlan.destinationIds];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= arr.length) return;
    [arr[index], arr[nextIndex]] = [arr[nextIndex], arr[index]];
    persist({
      ...state,
      dayPlans: state.dayPlans.map((d) => (d.day === selectedDay ? { ...d, destinationIds: arr } : d)),
    });
  };

  const saveCurrentItinerary = () => {
    if (!plannedDestinations.length) {
      message.error('No destination in current day plan');
      return;
    }
    const history: TripHistory = {
      id: uid(),
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
      destinationIds: plannedDestinations.map((d) => d.id),
      total: budget.total,
      food: budget.food,
      stay: budget.stay,
      transport: budget.transport,
    };
    persist({ ...state, tripHistory: [history, ...state.tripHistory] });
    message.success('Itinerary saved');
  };

  const openCreate = () => {
    setAdminModal({ open: true });
    adminForm.resetFields();
    adminForm.setFieldsValue({ type: 'CITY', rating: 4.5, visitHours: 4 });
  };

  const openEdit = (d: Destination) => {
    setAdminModal({ open: true, editId: d.id });
    adminForm.setFieldsValue(d);
  };

  const submitDestination = async () => {
    const v = await adminForm.validateFields();
    const payload: Destination = {
      id: adminModal.editId || uid(),
      name: v.name,
      location: v.location,
      type: v.type,
      rating: Number(v.rating),
      imageUrl: v.imageUrl,
      description: v.description,
      visitHours: Number(v.visitHours),
      costFood: Number(v.costFood),
      costStay: Number(v.costStay),
      costTransport: Number(v.costTransport),
    };
    const next = adminModal.editId
      ? state.destinations.map((d) => (d.id === adminModal.editId ? payload : d))
      : [payload, ...state.destinations];

    persist({ ...state, destinations: next });
    setAdminModal({ open: false });
  };

  const removeDestination = (id: string) => {
    persist({
      ...state,
      destinations: state.destinations.filter((d) => d.id !== id),
      dayPlans: state.dayPlans.map((d) => ({ ...d, destinationIds: d.destinationIds.filter((x) => x !== id) })),
    });
  };

  const stats = useMemo(() => {
    const byMonth: Record<string, number> = {};
    const byDestination: Record<string, number> = {};
    let totalRevenue = 0;
    let totalFood = 0;
    let totalStay = 0;
    let totalTransport = 0;

    state.tripHistory.forEach((h) => {
      const m = moment(h.createdAt).format('YYYY-MM');
      byMonth[m] = (byMonth[m] || 0) + 1;
      totalRevenue += h.total;
      totalFood += h.food;
      totalStay += h.stay;
      totalTransport += h.transport;
      h.destinationIds.forEach((id) => {
        const name = state.destinations.find((d) => d.id === id)?.name || 'Unknown';
        byDestination[name] = (byDestination[name] || 0) + 1;
      });
    });

    const top = Object.entries(byDestination).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { byMonth, totalRevenue, totalFood, totalStay, totalTransport, top };
  }, [state.tripHistory, state.destinations]);

  return (
    <Tabs defaultActiveKey="explore">
      <Tabs.TabPane tab="1. Explore" key="explore">
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 140 }}
            options={[
              { label: 'All', value: 'ALL' },
              { label: 'Beach', value: 'BEACH' },
              { label: 'Mountain', value: 'MOUNTAIN' },
              { label: 'City', value: 'CITY' },
            ]}
          />
          <InputNumber
            value={maxCost}
            onChange={(v) => setMaxCost(v || undefined)}
            placeholder="Max total cost"
            style={{ width: 180 }}
          />
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 160 }}
            options={[
              { label: 'Sort by rating', value: 'rating' },
              { label: 'Sort by cost', value: 'cost' },
            ]}
          />
        </Space>

        <Row gutter={[16, 16]}>
          {filteredDestinations.map((d) => (
            <Col xs={24} sm={12} md={8} lg={6} key={d.id}>
              <Card
                cover={<img src={d.imageUrl} style={{ height: 180, objectFit: 'cover' }} />}
                title={d.name}
                size="small"
              >
                <p>Location: {d.location}</p>
                <p>Type: {d.type}</p>
                <p>Rating: {d.rating}</p>
                <p>Total/day: {(d.costFood + d.costStay + d.costTransport).toLocaleString()} VND</p>
              </Card>
            </Col>
          ))}
        </Row>
      </Tabs.TabPane>

      <Tabs.TabPane tab="2. Itinerary" key="itinerary">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            <DatePicker
              value={moment(selectedDay)}
              onChange={(d) => setSelectedDay((d || moment()).format('YYYY-MM-DD'))}
              format="DD/MM/YYYY"
            />
            <Select
              placeholder="Choose destination"
              value={destinationToAdd}
              onChange={setDestinationToAdd}
              style={{ width: 280 }}
              options={state.destinations.map((d) => ({ label: `${d.name} - ${d.location}`, value: d.id }))}
            />
            <Button type="primary" onClick={addDestinationToDay}>Add</Button>
            <Button onClick={saveCurrentItinerary}>Save itinerary</Button>
          </Space>

          <Table
            rowKey="id"
            pagination={false}
            dataSource={plannedDestinations}
            columns={[
              { title: 'Destination', dataIndex: 'name' },
              { title: 'Visit hours', dataIndex: 'visitHours' },
              {
                title: 'Actions',
                render: (_, row, idx) => (
                  <Space>
                    <Button size="small" onClick={() => moveItem(idx, -1)}>Up</Button>
                    <Button size="small" onClick={() => moveItem(idx, 1)}>Down</Button>
                    <Button size="small" danger onClick={() => removeFromDay(row.id)}>Remove</Button>
                  </Space>
                ),
              },
            ]}
          />

          <Row gutter={12}>
            <Col xs={12} md={6}><Statistic title="Food" value={budget.food} suffix="VND" /></Col>
            <Col xs={12} md={6}><Statistic title="Stay" value={budget.stay} suffix="VND" /></Col>
            <Col xs={12} md={6}><Statistic title="Transport" value={budget.transport} suffix="VND" /></Col>
            <Col xs={12} md={6}><Statistic title="Total" value={budget.total} suffix="VND" /></Col>
          </Row>

          <p>
            Estimated time: Visit {budget.visitHours}h + Move {budget.moveHours}h = {budget.overallHours}h
          </p>
        </Space>
      </Tabs.TabPane>

      <Tabs.TabPane tab="3. Budget" key="budget">
        <Space direction="vertical" style={{ width: '100%' }}>
          <InputNumber
            value={state.budgetLimit}
            onChange={(v) => persist({ ...state, budgetLimit: Number(v || 0) })}
            style={{ width: 260 }}
            addonBefore="Budget limit"
            addonAfter="VND"
          />

          {budget.total > state.budgetLimit && (
            <Alert type="error" showIcon message="Budget exceeded!" description={`Exceeded ${(budget.total - state.budgetLimit).toLocaleString()} VND`} />
          )}

          <ReactApexChart
            type="pie"
            height={320}
            series={[budget.food, budget.stay, budget.transport]}
            options={{ labels: ['Food', 'Stay', 'Transport'] }}
          />
        </Space>
      </Tabs.TabPane>

      <Tabs.TabPane tab="4. Admin + Stats" key="admin">
        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" onClick={openCreate}>Add destination</Button>
        </Space>

        <Table
          rowKey="id"
          dataSource={state.destinations}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            { title: 'Location', dataIndex: 'location' },
            { title: 'Type', dataIndex: 'type' },
            { title: 'Rating', dataIndex: 'rating' },
            {
              title: 'Actions',
              render: (_, r) => (
                <Space>
                  <Button size="small" onClick={() => openEdit(r)}>Edit</Button>
                  <Popconfirm title="Delete destination?" onConfirm={() => removeDestination(r.id)}>
                    <Button size="small" danger>Delete</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />

        <Row gutter={12} style={{ marginTop: 16 }}>
          <Col xs={24} md={6}><Statistic title="Itineraries" value={state.tripHistory.length} /></Col>
          <Col xs={24} md={6}><Statistic title="Revenue(total)" value={stats.totalRevenue} suffix="VND" /></Col>
          <Col xs={24} md={6}><Statistic title="Food total" value={stats.totalFood} suffix="VND" /></Col>
          <Col xs={24} md={6}><Statistic title="Stay+Transport" value={stats.totalStay + stats.totalTransport} suffix="VND" /></Col>
        </Row>

        <Card size="small" title="Itineraries by month" style={{ marginTop: 16 }}>
          <pre>{JSON.stringify(stats.byMonth, null, 2)}</pre>
        </Card>

        <Card size="small" title="Top popular destinations" style={{ marginTop: 16 }}>
          {stats.top.map((x) => (
            <Tag key={x[0]}>{x[0]}: {x[1]}</Tag>
          ))}
        </Card>

        <Modal
          visible={adminModal.open}
          onCancel={() => setAdminModal({ open: false })}
          onOk={submitDestination}
          title={adminModal.editId ? 'Edit destination' : 'Add destination'}
          width={780}
        >
          <Form form={adminForm} layout="vertical">
            <Row gutter={12}>
              <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="location" label="Location" rules={[{ required: true }]}><Input /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                  <Select options={[{ label: 'Beach', value: 'BEACH' }, { label: 'Mountain', value: 'MOUNTAIN' }, { label: 'City', value: 'CITY' }]} />
                </Form.Item>
              </Col>
              <Col span={8}><Form.Item name="rating" label="Rating" rules={[{ required: true }]}><InputNumber min={1} max={5} step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="visitHours" label="Visit hours" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
            </Row>

            <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>

            <Row gutter={12}>
              <Col span={8}><Form.Item name="costFood" label="Food cost" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="costStay" label="Stay cost" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="costTransport" label="Transport cost" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            </Row>

            <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}>
              <Input placeholder="https://..." />
            </Form.Item>

            <Form.Item label="Upload image (optional overwrite URL)">
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                onChange={async (info) => {
                  const f = info.file.originFileObj as File;
                  if (!f) return;
                  const b64 = await toBase64(f);
                  adminForm.setFieldsValue({ imageUrl: b64 });
                }}
              >
                <Button icon={<UploadOutlined />}>Upload</Button>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>
      </Tabs.TabPane>
    </Tabs>
  );
};

export default TH06Simple;