import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import ReactApexChart from 'react-apexcharts';
import moment from 'moment';
import { useMemo, useState } from 'react';
import {
  loadState,
  removeApplication,
  removeClub,
  reviewApplication,
  saveState,
  transferMembersClub,
  upsertApplication,
  upsertClub,
} from './storage';
import type { ApplicationItem, ApplicationStatus, Club, TH05State } from './types';

const TH05Page = () => {
  const [state, setState] = useState<TH05State>(loadState());
  const [clubForm] = Form.useForm();
  const [appForm] = Form.useForm();

  const [clubModal, setClubModal] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [appModal, setAppModal] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; ids: string[] }>({ open: false, ids: [] });
  const [historyModal, setHistoryModal] = useState<{ open: boolean; appId?: string }>({ open: false });
  const [transferModal, setTransferModal] = useState<{ open: boolean; ids: string[] }>({ open: false, ids: [] });

  const [clubKeyword, setClubKeyword] = useState('');
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const clubMap = useMemo(() => Object.fromEntries(state.clubs.map((c) => [c.id, c])), [state.clubs]);

  const persist = (next: TH05State) => {
    setState(next);
    saveState(next);
  };

  const clubRows = useMemo(() => {
    const kw = clubKeyword.trim().toLowerCase();
    if (!kw) return state.clubs;
    return state.clubs.filter((c) => c.name.toLowerCase().includes(kw) || c.leaderName.toLowerCase().includes(kw));
  }, [state.clubs, clubKeyword]);

  const memberRows = useMemo(() => state.applications.filter((a) => a.status === 'APPROVED'), [state.applications]);

  const chartData = useMemo(() => {
    const categories = state.clubs.map((c) => c.name);
    const pending = state.clubs.map((c) => state.applications.filter((a) => a.clubId === c.id && a.status === 'PENDING').length);
    const approved = state.clubs.map((c) => state.applications.filter((a) => a.clubId === c.id && a.status === 'APPROVED').length);
    const rejected = state.clubs.map((c) => state.applications.filter((a) => a.clubId === c.id && a.status === 'REJECTED').length);
    return { categories, pending, approved, rejected };
  }, [state.clubs, state.applications]);

  const submitClub = async () => {
    const v = await clubForm.validateFields();
    const next = upsertClub(
      state,
      {
        imageUrl: v.imageUrl,
        name: v.name,
        establishedDate: v.establishedDate.format('YYYY-MM-DD'),
        descriptionHtml: v.descriptionHtml,
        leaderName: v.leaderName,
        active: v.active,
      },
      clubModal.editId,
    );
    persist(next);
    setClubModal({ open: false });
    message.success(clubModal.editId ? 'Da cap nhat CLB' : 'Da them CLB');
  };

  const submitApp = async () => {
    const v = await appForm.validateFields();
    const next = upsertApplication(
      state,
      {
        fullName: v.fullName,
        email: v.email,
        phone: v.phone,
        gender: v.gender,
        address: v.address,
        school: v.school,
        clubId: v.clubId,
        reason: v.reason,
        status: v.status,
        rejectReason: v.rejectReason,
      },
      appModal.editId,
    );
    persist(next);
    setAppModal({ open: false });
    message.success(appModal.editId ? 'Da cap nhat don' : 'Da them don');
  };

  const doApprove = (ids: string[]) => {
    persist(reviewApplication(state, ids, 'APPROVED'));
    setSelectedAppIds([]);
    message.success(`Da duyet ${ids.length} don`);
  };

  const doReject = (ids: string[], reason: string) => {
    persist(reviewApplication(state, ids, 'REJECTED', reason));
    setSelectedAppIds([]);
    message.success(`Da tu choi ${ids.length} don`);
  };

  const doTransfer = (clubId: string) => {
    persist(transferMembersClub(state, transferModal.ids, clubId));
    setTransferModal({ open: false, ids: [] });
    setSelectedMemberIds([]);
    message.success(`Da chuyen ${transferModal.ids.length} thanh vien`);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card title="TH05 - Quan ly CLB va Dang ky thanh vien">
        <Row gutter={12}>
          <Col span={6}><Statistic title="Tong CLB" value={state.clubs.length} /></Col>
          <Col span={6}><Statistic title="Pending" value={state.applications.filter((x) => x.status === 'PENDING').length} /></Col>
          <Col span={6}><Statistic title="Approved" value={state.applications.filter((x) => x.status === 'APPROVED').length} /></Col>
          <Col span={6}><Statistic title="Rejected" value={state.applications.filter((x) => x.status === 'REJECTED').length} /></Col>
        </Row>
      </Card>

      <Card
        title="1) Danh sach CLB"
        extra={
          <Button
            type="primary"
            onClick={() => {
              setClubModal({ open: true });
              clubForm.resetFields();
              clubForm.setFieldsValue({ active: true });
            }}
          >
            Them CLB
          </Button>
        }
      >
        <Input
          placeholder="Tim theo ten/chu nhiem"
          value={clubKeyword}
          onChange={(e) => setClubKeyword(e.target.value)}
          style={{ width: 320, marginBottom: 12 }}
        />
        <Table
          rowKey="id"
          dataSource={clubRows}
          columns={[
            { title: 'Anh', dataIndex: 'imageUrl', width: 90, render: (v) => <Image src={v} width={52} height={52} /> },
            { title: 'Ten CLB', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
            { title: 'Ngay thanh lap', dataIndex: 'establishedDate', sorter: (a, b) => moment(a.establishedDate).valueOf() - moment(b.establishedDate).valueOf() },
            { title: 'Mo ta', dataIndex: 'descriptionHtml', render: (v) => <div dangerouslySetInnerHTML={{ __html: v }} /> },
            { title: 'Chu nhiem', dataIndex: 'leaderName' },
            { title: 'Hoat dong', dataIndex: 'active', render: (v) => (v ? <Tag color="green">Co</Tag> : <Tag color="red">Khong</Tag>) },
            {
              title: 'Thao tac',
              render: (_, r: Club) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() => {
                      setClubModal({ open: true, editId: r.id });
                      clubForm.setFieldsValue({
                        ...r,
                        establishedDate: moment(r.establishedDate),
                      });
                    }}
                  >
                    Sua
                  </Button>
                  <Popconfirm title="Xoa CLB?" onConfirm={() => persist(removeClub(state, r.id))}>
                    <Button size="small" danger>Xoa</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Card
        title="2) Quan ly don dang ky"
        extra={
          <Space>
            <Button
              type="primary"
              onClick={() => {
                setAppModal({ open: true });
                appForm.resetFields();
                appForm.setFieldsValue({ gender: 'Male', status: 'PENDING' });
              }}
            >
              Them don
            </Button>
            <Button disabled={!selectedAppIds.length} onClick={() => doApprove(selectedAppIds)}>
              Duyet {selectedAppIds.length}
            </Button>
            <Button danger disabled={!selectedAppIds.length} onClick={() => setRejectModal({ open: true, ids: selectedAppIds })}>
              Tu choi {selectedAppIds.length}
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedAppIds,
            onChange: (keys) => setSelectedAppIds(keys as string[]),
          }}
          dataSource={state.applications}
          columns={[
            { title: 'Ho ten', dataIndex: 'fullName' },
            { title: 'Email', dataIndex: 'email' },
            { title: 'SDT', dataIndex: 'phone' },
            { title: 'Gioi tinh', dataIndex: 'gender' },
            { title: 'Dia chi', dataIndex: 'address' },
            { title: 'So truong', dataIndex: 'school' },
            { title: 'CLB', render: (_, r: ApplicationItem) => clubMap[r.clubId]?.name || '-' },
            { title: 'Ly do', dataIndex: 'reason' },
            {
              title: 'Trang thai',
              dataIndex: 'status',
              render: (v: ApplicationStatus) =>
                v === 'PENDING' ? <Tag>Pending</Tag> : v === 'APPROVED' ? <Tag color="green">Approved</Tag> : <Tag color="red">Rejected</Tag>,
            },
            { title: 'Ghi chu', dataIndex: 'rejectReason' },
            {
              title: 'Thao tac',
              render: (_, r: ApplicationItem) => (
                <Space>
                  <Button size="small" onClick={() => { setAppModal({ open: true, editId: r.id }); appForm.setFieldsValue(r); }}>Sua</Button>
                  <Popconfirm title="Xoa don?" onConfirm={() => persist(removeApplication(state, r.id))}>
                    <Button size="small" danger>Xoa</Button>
                  </Popconfirm>
                  <Button size="small" onClick={() => doApprove([r.id])}>Duyet</Button>
                  <Button size="small" danger onClick={() => setRejectModal({ open: true, ids: [r.id] })}>Tu choi</Button>
                  <Button size="small" onClick={() => setHistoryModal({ open: true, appId: r.id })}>Lich su</Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Card
        title="3) Quan ly thanh vien CLB (Approved)"
        extra={
          <Button disabled={!selectedMemberIds.length} onClick={() => setTransferModal({ open: true, ids: selectedMemberIds })}>
            Doi CLB {selectedMemberIds.length}
          </Button>
        }
      >
        <Table
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedMemberIds,
            onChange: (keys) => setSelectedMemberIds(keys as string[]),
          }}
          dataSource={memberRows}
          columns={[
            { title: 'Ho ten', dataIndex: 'fullName' },
            { title: 'Email', dataIndex: 'email' },
            { title: 'SDT', dataIndex: 'phone' },
            { title: 'CLB hien tai', render: (_, r: ApplicationItem) => clubMap[r.clubId]?.name || '-' },
          ]}
        />
      </Card>

      <Card title="4) Bao cao thong ke">
        <ReactApexChart
          type="bar"
          height={340}
          series={[
            { name: 'Pending', data: chartData.pending },
            { name: 'Approved', data: chartData.approved },
            { name: 'Rejected', data: chartData.rejected },
          ]}
          options={{
            chart: { toolbar: { show: false } },
            xaxis: { categories: chartData.categories },
            dataLabels: { enabled: true },
          }}
        />
      </Card>

      <Modal
        visible={clubModal.open}
        title={clubModal.editId ? 'Sua CLB' : 'Them CLB'}
        onCancel={() => setClubModal({ open: false })}
        onOk={submitClub}
        width={760}
      >
        <Form form={clubForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}><Form.Item name="name" label="Ten CLB" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="leaderName" label="Chu nhiem" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="establishedDate" label="Ngay thanh lap" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="imageUrl" label="Anh URL" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="descriptionHtml" label="Mo ta HTML" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="active" label="Hoat dong" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      <Modal
        visible={appModal.open}
        title={appModal.editId ? 'Sua don' : 'Them don'}
        onCancel={() => setAppModal({ open: false })}
        onOk={submitApp}
        width={900}
      >
        <Form form={appForm} layout="vertical">
          <Row gutter={12}>
            <Col span={8}><Form.Item name="fullName" label="Ho ten" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="phone" label="SDT" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="gender" label="Gioi tinh" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio value="Male">Nam</Radio>
                  <Radio value="Female">Nu</Radio>
                  <Radio value="Other">Khac</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="school" label="So truong" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="clubId" label="CLB" rules={[{ required: true }]}><Select options={state.clubs.map((c) => ({ label: c.name, value: c.id }))} /></Form.Item></Col>
          </Row>
          <Form.Item name="address" label="Dia chi" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="reason" label="Ly do dang ky" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="status" label="Trang thai" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: 'Pending', value: 'PENDING' },
                    { label: 'Approved', value: 'APPROVED' },
                    { label: 'Rejected', value: 'REJECTED' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="rejectReason" label="Ly do tu choi"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <RejectModal
        open={rejectModal.open}
        onCancel={() => setRejectModal({ open: false, ids: [] })}
        onSubmit={(reason) => {
          doReject(rejectModal.ids, reason);
          setRejectModal({ open: false, ids: [] });
        }}
      />

      <Modal
        visible={historyModal.open}
        title="Lich su thao tac"
        onCancel={() => setHistoryModal({ open: false })}
        footer={null}
        width={860}
      >
        <Table
          rowKey="id"
          dataSource={state.histories.filter((h) => h.applicationId === historyModal.appId)}
          columns={[
            { title: 'Thoi gian', dataIndex: 'createdAt', width: 180 },
            { title: 'Hanh dong', dataIndex: 'action', width: 140 },
            { title: 'Noi dung', dataIndex: 'note' },
            { title: 'Nguoi thao tac', dataIndex: 'actor', width: 120 },
          ]}
        />
      </Modal>

      <TransferModal
        open={transferModal.open}
        clubs={state.clubs}
        count={transferModal.ids.length}
        onCancel={() => setTransferModal({ open: false, ids: [] })}
        onSubmit={doTransfer}
      />
    </Space>
  );
};

const RejectModal: React.FC<{ open: boolean; onCancel: () => void; onSubmit: (reason: string) => void }> = ({
  open,
  onCancel,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');

  return (
    <Modal
      visible={open}
      title="Nhap ly do tu choi"
      onCancel={() => {
        setReason('');
        onCancel();
      }}
      onOk={() => {
        if (!reason.trim()) {
          message.error('Bat buoc nhap ly do');
          return;
        }
        onSubmit(reason.trim());
        setReason('');
      }}
    >
      <Input.TextArea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
    </Modal>
  );
};

const TransferModal: React.FC<{
  open: boolean;
  clubs: Club[];
  count: number;
  onCancel: () => void;
  onSubmit: (clubId: string) => void;
}> = ({ open, clubs, count, onCancel, onSubmit }) => {
  const [clubId, setClubId] = useState<string>();

  return (
    <Modal
      visible={open}
      title={`Doi CLB cho ${count} thanh vien`}
      onCancel={() => {
        setClubId(undefined);
        onCancel();
      }}
      onOk={() => {
        if (!clubId) {
          message.error('Vui long chon CLB dich');
          return;
        }
        onSubmit(clubId);
        setClubId(undefined);
      }}
    >
      <Select
        style={{ width: '100%' }}
        value={clubId}
        onChange={setClubId}
        options={clubs.map((c) => ({ label: c.name, value: c.id }))}
      />
    </Modal>
  );
};

export default TH05Page;