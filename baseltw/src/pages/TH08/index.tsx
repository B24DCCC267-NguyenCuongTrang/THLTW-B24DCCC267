import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import moment from 'moment';

type WorkoutStatus = 'done' | 'missed' | 'planned';
type GoalStatus = 'active' | 'completed' | 'cancelled';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Workout {
  id: string;
  date: string; // ISO
  type: string; // e.g., Cardio, Strength
  durationMin: number;
  calories: number;
  notes?: string;
  status: WorkoutStatus;
}

interface HealthRecord {
  id: string;
  date: string;
  weightKg: number;
  heightCm: number;
  restingBpm?: number;
  sleepHours?: number;
}

interface GoalItem {
  id: string;
  title: string;
  category: string;
  targetValue?: number;
  progressPercent: number;
  deadline?: string;
  status: GoalStatus;
}

interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: string;
  difficulty: Difficulty;
  description?: string;
}

const WK_KEY = 'th08_workouts_v1';
const HR_KEY = 'th08_health_v1';
const GOAL_KEY = 'th08_goals_v1';
const EX_KEY = 'th08_exs_v1';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const seedWorkouts: Workout[] = [
  { id: 'w1', date: new Date().toISOString(), type: 'Cardio', durationMin: 30, calories: 280, status: 'done' },
  { id: 'w2', date: new Date(Date.now() - 2 * 86400000).toISOString(), type: 'Strength', durationMin: 45, calories: 350, status: 'done' },
  { id: 'w3', date: new Date(Date.now() + 86400000).toISOString(), type: 'HIIT', durationMin: 20, calories: 260, status: 'planned' },
];

const seedHealth: HealthRecord[] = [
  { id: 'h1', date: new Date().toISOString(), weightKg: 72, heightCm: 175, restingBpm: 60, sleepHours: 7 },
  { id: 'h2', date: new Date(Date.now() - 86400000).toISOString(), weightKg: 72.2, heightCm: 175, restingBpm: 62, sleepHours: 6.5 },
];

const seedGoals: GoalItem[] = [
  { id: 'g1', title: 'Giảm 3kg', category: 'Giảm cân', targetValue: 3, progressPercent: 40, deadline: new Date(Date.now() + 14 * 86400000).toISOString(), status: 'active' },
  { id: 'g2', title: 'Chạy 5km liên tiếp', category: 'Cardio', progressPercent: 80, status: 'active' },
];

const seedExs: ExerciseItem[] = [
  { id: 'e1', name: 'Push-up', muscleGroup: 'Chest', difficulty: 'medium', description: 'Push-up tiêu chuẩn' },
  { id: 'e2', name: 'Squat', muscleGroup: 'Legs', difficulty: 'easy', description: 'Squat cơ bản' },
  { id: 'e3', name: 'Plank', muscleGroup: 'Core', difficulty: 'easy', description: 'Plank giữ 60s' },
];

export default function TH08Sample(): JSX.Element {
  // data states
  const [workouts, setWorkouts] = useState<Workout[]>(() => safeParse<Workout[]>(localStorage.getItem(WK_KEY), seedWorkouts));
  const [health, setHealth] = useState<HealthRecord[]>(() => safeParse<HealthRecord[]>(localStorage.getItem(HR_KEY), seedHealth));
  const [goals, setGoals] = useState<GoalItem[]>(() => safeParse<GoalItem[]>(localStorage.getItem(GOAL_KEY), seedGoals));
  const [exs, setExs] = useState<ExerciseItem[]>(() => safeParse<ExerciseItem[]>(localStorage.getItem(EX_KEY), seedExs));

  const [activeTab, setActiveTab] = useState<'dashboard'|'log'|'health'|'goals'|'library'>('dashboard');

  // workout modal
  const [wkModalOpen, setWkModalOpen] = useState(false);
  const [editingWk, setEditingWk] = useState<Workout | null>(null);
  const [wkForm] = Form.useForm();

  // health modal
  const [hrModalOpen, setHrModalOpen] = useState(false);
  const [editingHr, setEditingHr] = useState<HealthRecord | null>(null);
  const [hrForm] = Form.useForm();

  // goal drawer
  const [goalDrawerOpen, setGoalDrawerOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [goalForm] = Form.useForm();

  // exercise modal
  const [exModalOpen, setExModalOpen] = useState(false);
  const [editingEx, setEditingEx] = useState<ExerciseItem | null>(null);
  const [exForm] = Form.useForm();

  useEffect(() => {
    localStorage.setItem(WK_KEY, JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem(HR_KEY, JSON.stringify(health));
  }, [health]);

  useEffect(() => {
    localStorage.setItem(GOAL_KEY, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(EX_KEY, JSON.stringify(exs));
  }, [exs]);

  // Dashboard quick stats
  const totalThisMonth = useMemo(() => {
    const start = moment().startOf('month');
    return workouts.filter(w => moment(w.date).isSameOrAfter(start)).length;
  }, [workouts]);

  const totalCaloriesThisMonth = useMemo(() => {
    const start = moment().startOf('month');
    return workouts.filter(w => moment(w.date).isSameOrAfter(start)).reduce((s, w) => s + (w.calories || 0), 0);
  }, [workouts]);

  const streak = useMemo(() => {
    // naive: count consecutive days from today backward with at least one done workout
    let days = 0;
    for (let i=0;i<30;i++){
      const d = moment().startOf('day').subtract(i,'days');
      const any = workouts.some(w => moment(w.date).isSame(d, 'day') && w.status === 'done');
      if (any) days++; else break;
    }
    return days;
  }, [workouts]);

  const completedGoals = useMemo(() => goals.filter(g => g.status === 'completed').length, [goals]);

  // Health helpers
  const calcBmi = (weightKg: number, heightCm: number) => {
    if (!weightKg || !heightCm) return 0;
    const m = heightCm / 100;
    return +(weightKg / (m * m));
  };
  const bmiTag = (bmi: number) => {
    if (bmi === 0) return <Tag>—</Tag>;
    if (bmi < 18.5) return <Tag color="blue">Thiếu cân</Tag>;
    if (bmi < 25) return <Tag color="green">Bình thường</Tag>;
    if (bmi < 30) return <Tag color="gold">Thừa cân</Tag>;
    return <Tag color="red">Béo phì</Tag>;
  };

  // Workout table columns
  const wkCols: ColumnsType<Workout> = [
    { title: 'Ngày', dataIndex: 'date', render: d => moment(d).format('YYYY-MM-DD') },
    { title: 'Loại', dataIndex: 'type' },
    { title: 'Thời lượng (phút)', dataIndex: 'durationMin' },
    { title: 'Calo', dataIndex: 'calories' },
    { title: 'Ghi chú', dataIndex: 'notes' },
    { title: 'Trạng thái', dataIndex: 'status', render: (s: WorkoutStatus) => <Tag color={s==='done'?'green': s==='missed'?'red':'default'}>{s==='done'?'Hoàn thành': s==='missed'?'Bỏ lỡ':'Dự kiến'}</Tag> },
    { title: 'Hành động', render: (_, r) => (
      <Space>
        <Button size="small" onClick={() => { setEditingWk(r); wkForm.setFieldsValue({ ...r, date: moment(r.date) }); setWkModalOpen(true); }}>Sửa</Button>
        <Popconfirm title="Xóa buổi tập?" onConfirm={() => { setWorkouts(ws => ws.filter(x=>x.id!==r.id)); message.success('Đã xóa'); }}>
          <Button size="small" danger>Xóa</Button>
        </Popconfirm>
      </Space>
    ) }
  ];

  // Health table columns
  const hrCols: ColumnsType<HealthRecord> = [
    { title: 'Ngày', dataIndex: 'date', render: d => moment(d).format('YYYY-MM-DD') },
    { title: 'Cân nặng (kg)', dataIndex: 'weightKg' },
    { title: 'Chiều cao (cm)', dataIndex: 'heightCm' },
    { title: 'BMI', render: (_, r) => {
      const bmi = calcBmi(r.weightKg, r.heightCm);
      return <span>{bmi.toFixed(1)} {bmiTag(bmi)}</span>;
    } },
    { title: 'Nhịp tim', dataIndex: 'restingBpm' },
    { title: 'Ngủ (giờ)', dataIndex: 'sleepHours' },
    { title: 'Hành động', render: (_, r) => (
      <Space>
        <Button size="small" onClick={() => { setEditingHr(r); hrForm.setFieldsValue({ ...r, date: moment(r.date) }); setHrModalOpen(true); }}>Sửa</Button>
        <Popconfirm title="Xóa chỉ số?" onConfirm={() => { setHealth(hs => hs.filter(x=>x.id!==r.id)); message.success('Đã xóa'); }}>
          <Button size="small" danger>Xóa</Button>
        </Popconfirm>
      </Space>
    ) },
  ];

  // CRUD handlers
  const openCreateWorkout = () => {
    setEditingWk(null);
    wkForm.resetFields();
    wkForm.setFieldsValue({ date: moment(), type: 'Cardio', durationMin: 30, calories: 200, status: 'planned' });
    setWkModalOpen(true);
  };
  const saveWorkout = async () => {
    const v = await wkForm.validateFields();
    const payload: Workout = {
      id: editingWk ? editingWk.id : `w_${Date.now()}`,
      date: v.date.toISOString(),
      type: v.type,
      durationMin: v.durationMin,
      calories: v.calories,
      notes: v.notes,
      status: v.status,
    };
    setWorkouts(ws => editingWk ? ws.map(x => x.id===editingWk.id ? payload : x) : [payload, ...ws]);
    setWkModalOpen(false);
    message.success(editingWk ? 'Cập nhật buổi tập' : 'Thêm buổi tập');
  };

  const openCreateHealth = () => {
    setEditingHr(null);
    hrForm.resetFields();
    hrForm.setFieldsValue({ date: moment(), weightKg: 70, heightCm: 170 });
    setHrModalOpen(true);
  };
  const saveHealth = async () => {
    const v = await hrForm.validateFields();
    const payload: HealthRecord = {
      id: editingHr ? editingHr.id : `h_${Date.now()}`,
      date: v.date.toISOString(),
      weightKg: v.weightKg,
      heightCm: v.heightCm,
      restingBpm: v.restingBpm,
      sleepHours: v.sleepHours,
    };
    setHealth(hs => editingHr ? hs.map(x => x.id===editingHr.id ? payload : x) : [payload, ...hs]);
    setHrModalOpen(false);
    message.success(editingHr ? 'Cập nhật chỉ số' : 'Thêm chỉ số');
  };

  const openCreateGoal = (g?: GoalItem) => {
    setEditingGoal(g || null);
    goalForm.resetFields();
    if (g) goalForm.setFieldsValue({ ...g, deadline: g.deadline ? moment(g.deadline) : undefined });
    setGoalDrawerOpen(true);
  };
  const saveGoal = async () => {
    const v = await goalForm.validateFields();
    const payload: GoalItem = {
      id: editingGoal ? editingGoal.id : `g_${Date.now()}`,
      title: v.title,
      category: v.category,
      targetValue: v.targetValue,
      progressPercent: v.progressPercent || 0,
      deadline: v.deadline ? v.deadline.toISOString() : undefined,
      status: v.status || 'active',
    };
    setGoals(gs => editingGoal ? gs.map(x => x.id===editingGoal.id ? payload : x) : [payload, ...gs]);
    setGoalDrawerOpen(false);
    message.success(editingGoal ? 'Cập nhật mục tiêu' : 'Thêm mục tiêu');
  };

  const openCreateEx = (e?: ExerciseItem) => {
    setEditingEx(e || null);
    exForm.resetFields();
    if (e) exForm.setFieldsValue(e);
    setExModalOpen(true);
  };
  const saveEx = async () => {
    const v = await exForm.validateFields();
    const payload: ExerciseItem = {
      id: editingEx ? editingEx.id : `ex_${Date.now()}`,
      name: v.name,
      muscleGroup: v.muscleGroup,
      difficulty: v.difficulty,
      description: v.description,
    };
    setExs(xs => editingEx ? xs.map(x => x.id===editingEx.id ? payload : x) : [payload, ...xs]);
    setExModalOpen(false);
    message.success(editingEx ? 'Cập nhật bài tập' : 'Thêm bài tập');
  };

  // small charts: weekly counts
  const weeklyCounts = useMemo(() => {
    const start = moment().startOf('week');
    return Array.from({length:7}).map((_,i) => {
      const day = moment(start).add(i,'days');
      const count = workouts.filter(w => moment(w.date).isSame(day,'day')).length;
      return { day: day.format('dd'), count };
    });
  }, [workouts]);

  return (
    <Card>
      <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as any)}>
        <Tabs.TabPane tab="1. Dashboard" key="dashboard">
          <Row gutter={[16,16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Typography.Text>Buổi tập tháng</Typography.Text>
                <Typography.Title level={3}>{totalThisMonth}</Typography.Title>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Typography.Text>Tổng calo</Typography.Text>
                <Typography.Title level={3}>{totalCaloriesThisMonth}</Typography.Title>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Typography.Text>Streak (ngày)</Typography.Text>
                <Typography.Title level={3}>{streak}</Typography.Title>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Typography.Text>Mục tiêu hoàn thành</Typography.Text>
                <Typography.Title level={3}>{completedGoals}</Typography.Title>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16,16]}>
            <Col xs={24} md={12}>
              <Card title="Số buổi theo tuần (tuần này)">
                <Space style={{width:'100%', justifyContent:'space-between'}}>
                  {weeklyCounts.map(w => (
                    <div key={w.day} style={{textAlign:'center', width: '12%'}}>
                      <div style={{height: 60, background:'#f5f5f5'}}>{/* tiny bar */}</div>
                      <div>{w.day}</div>
                      <div>{w.count}</div>
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="5 buổi gần nhất (Timeline)">
                <div>
                  {workouts.slice(0,5).map(w => (
                    <div key={w.id} style={{marginBottom:8}}>
                      <b>{moment(w.date).format('YYYY-MM-DD')}</b> — {w.type} — {w.durationMin} phút — <Tag>{w.calories} kcal</Tag>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>

        <Tabs.TabPane tab="2. Nhật ký tập luyện" key="log">
          <Space direction="vertical" style={{width:'100%'}}>
            <Space>
              <Button type="primary" onClick={openCreateWorkout}>Thêm buổi tập</Button>
            </Space>

            <Table rowKey="id" columns={wkCols} dataSource={workouts} pagination={{pageSize:8}} />
          </Space>
        </Tabs.TabPane>

        <Tabs.TabPane tab="3. Nhật ký chỉ số sức khỏe" key="health">
          <Space direction="vertical" style={{width:'100%'}}>
            <Space>
              <Button onClick={openCreateHealth}>Thêm chỉ số</Button>
            </Space>

            <Table rowKey="id" columns={hrCols} dataSource={health} pagination={{pageSize:8}} />

            <Divider />

            <Card title="BMI theo ngày">
              <Row gutter={[8,8]}>
                {health.map(h => {
                  const bmi = calcBmi(h.weightKg, h.heightCm);
                  return (
                    <Col key={h.id} xs={24} sm={12} md={8}>
                      <Card>
                        <div><b>{moment(h.date).format('YYYY-MM-DD')}</b></div>
                        <div>Cân nặng: {h.weightKg} kg</div>
                        <div>Chiều cao: {h.heightCm} cm</div>
                        <div>BMI: {bmi.toFixed(1)} {bmiTag(bmi)}</div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </Space>
        </Tabs.TabPane>

        <Tabs.TabPane tab="4. Quản lý mục tiêu" key="goals">
          <Space direction="vertical" style={{width:'100%'}}>
            <Button type="primary" onClick={() => openCreateGoal()}>Thêm mục tiêu</Button>
            <Row gutter={[16,16]}>
              {goals.map(g => (
                <Col key={g.id} xs={24} sm={12} md={8}>
                  <Card
                    title={g.title}
                    extra={<Space>
                      <Button size="small" onClick={() => openCreateGoal(g)}>Sửa</Button>
                      <Popconfirm title="Xóa mục tiêu?" onConfirm={() => setGoals(gs => gs.filter(x=>x.id!==g.id))}>
                        <Button size="small" danger>Xóa</Button>
                      </Popconfirm>
                    </Space>}
                  >
                    <div>Loại: {g.category}</div>
                    <div>Progress: <Progress percent={g.progressPercent} size="small" /></div>
                    <div>Deadline: {g.deadline ? moment(g.deadline).format('YYYY-MM-DD') : '—'}</div>
                    <div>Trạng thái: <Tag color={g.status==='completed'?'green': g.status==='cancelled'?'red':'blue'}>{g.status}</Tag></div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Space>
        </Tabs.TabPane>

        <Tabs.TabPane tab="5. Thư viện bài tập" key="library">
          <Space direction="vertical" style={{width:'100%'}}>
            <Button type="primary" onClick={() => openCreateEx()}>Thêm bài tập</Button>
            <Row gutter={[16,16]}>
              {exs.map(e => (
                <Col key={e.id} xs={24} sm={12} md={8}>
                  <Card hoverable onClick={() => openCreateEx(e)}>
                    <Card.Meta
                      avatar={<Avatar>{e.name[0]}</Avatar>}
                      title={e.name}
                      description={<div>
                        <div>Nhóm: {e.muscleGroup}</div>
                        <div>Độ khó: <Tag color={e.difficulty==='easy'?'green': e.difficulty==='medium'?'gold':'red'}>{e.difficulty}</Tag></div>
                      </div>}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Space>
        </Tabs.TabPane>
      </Tabs>

      {/* Modals and Drawers */}
      <Modal open={wkModalOpen} title={editingWk ? 'Sửa buổi tập' : 'Thêm buổi tập'} onCancel={()=>setWkModalOpen(false)} onOk={saveWorkout} width={700}>
        <Form form={wkForm} layout="vertical">
          <Form.Item name="date" label="Ngày" rules={[{required:true}]}>
            <DatePicker showTime />
          </Form.Item>
          <Form.Item name="type" label="Loại" rules={[{required:true}]}>
            <Select options={[{label:'Cardio',value:'Cardio'},{label:'Strength',value:'Strength'},{label:'HIIT',value:'HIIT'},{label:'Yoga',value:'Yoga'}]} />
          </Form.Item>
          <Form.Item name="durationMin" label="Thời lượng (phút)" rules={[{required:true}]}>
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="calories" label="Calo (kcal)" rules={[{required:true}]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{required:true}]}>
            <Select options={[{label:'Hoàn thành',value:'done'},{label:'Bỏ lỡ',value:'missed'},{label:'Dự kiến',value:'planned'}]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal open={hrModalOpen} title={editingHr ? 'Sửa chỉ số' : 'Thêm chỉ số'} onCancel={()=>setHrModalOpen(false)} onOk={saveHealth}>
        <Form form={hrForm} layout="vertical">
          <Form.Item name="date" label="Ngày" rules={[{required:true}]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="weightKg" label="Cân nặng (kg)" rules={[{required:true}]}>
            <InputNumber min={20} />
          </Form.Item>
          <Form.Item name="heightCm" label="Chiều cao (cm)" rules={[{required:true}]}>
            <InputNumber min={50} />
          </Form.Item>
          <Form.Item name="restingBpm" label="Nhịp tim nghỉ (bpm)">
            <InputNumber />
          </Form.Item>
          <Form.Item name="sleepHours" label="Giờ ngủ">
            <InputNumber min={0} max={24} step={0.5} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title={editingGoal ? 'Sửa mục tiêu' : 'Thêm mục tiêu'} open={goalDrawerOpen} onClose={()=>setGoalDrawerOpen(false)} width={480} footer={<Space><Button onClick={()=>setGoalDrawerOpen(false)}>Huỷ</Button><Button type="primary" onClick={saveGoal}>Lưu</Button></Space>}>
        <Form form={goalForm} layout="vertical">
          <Form.Item name="title" label="Tên mục tiêu" rules={[{required:true}]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Loại">
            <Input />
          </Form.Item>
          <Form.Item name="targetValue" label="Giá trị mục tiêu (tùy chọn)">
            <InputNumber />
          </Form.Item>
          <Form.Item name="progressPercent" label="Tiến độ (%)">
            <InputNumber min={0} max={100} />
          </Form.Item>
          <Form.Item name="deadline" label="Deadline">
            <DatePicker />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select options={[{label:'Đang thực hiện',value:'active'},{label:'Đã đạt',value:'completed'},{label:'Đã hủy',value:'cancelled'}]} />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal open={exModalOpen} title={editingEx ? 'Sửa bài tập' : 'Thêm bài tập'} onCancel={()=>setExModalOpen(false)} onOk={saveEx}>
        <Form form={exForm} layout="vertical">
          <Form.Item name="name" label="Tên bài tập" rules={[{required:true}]}>
            <Input />
          </Form.Item>
          <Form.Item name="muscleGroup" label="Nhóm cơ">
            <Input />
          </Form.Item>
          <Form.Item name="difficulty" label="Mức độ" rules={[{required:true}]}>
            <Select options={[{label:'Dễ',value:'easy'},{label:'Trung bình',value:'medium'},{label:'Khó',value:'hard'}]} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}