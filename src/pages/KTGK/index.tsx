import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import moment from 'moment';

type OrderStatus = 'CHO_XAC_NHAN' | 'DANG_GIAO' | 'HOAN_THANH' | 'HUY';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Customer {
  id: string;
  name: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
}

interface Order {
  id: string;
  code: string;
  customerId: string;
  orderDate: string; // YYYY-MM-DD
  items: OrderItem[];
  total: number;
  status: OrderStatus;
}

const STORAGE_KEY = 'ktgk_orders_v1';
const uid = () => Math.random().toString(36).slice(2, 10);

const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Nguyễn Đức Anh' },
  { id: 'c2', name: 'Trần Thị Bích' },
  { id: 'c3', name: 'Lê Văn Cao' },
];

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Áo thun', price: 120000 },
  { id: 'p2', name: 'Quần jean', price: 350000 },
  { id: 'p3', name: 'Giày thể thao', price: 900000 },
  { id: 'p4', name: 'Balo', price: 280000 },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  CHO_XAC_NHAN: 'Chờ xác nhận',
  DANG_GIAO: 'Đang giao',
  HOAN_THANH: 'Hoàn thành',
  HUY: 'Hủy',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  CHO_XAC_NHAN: 'gold',
  DANG_GIAO: 'blue',
  HOAN_THANH: 'green',
  HUY: 'red',
};

const loadOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveOrders = (orders: Order[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};

const calcTotal = (items: OrderItem[]) => {
  return items.reduce((sum, it) => {
    const p = PRODUCTS.find((x) => x.id === it.productId);
    return sum + (p ? p.price * it.quantity : 0);
  }, 0);
};

const KTGKOrderPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(loadOrders());
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [form] = Form.useForm();

  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'TOTAL_DESC' | 'TOTAL_ASC'>('DATE_DESC');

  const customerMap = useMemo(
    () => Object.fromEntries(CUSTOMERS.map((c) => [c.id, c.name])),
    [],
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'CHO_XAC_NHAN',
      items: [{ productId: undefined, quantity: 1 }],
      orderDate: moment(),
    });
    setVisible(true);
  };

  const openEdit = (order: Order) => {
    setEditing(order);
    form.setFieldsValue({
      code: order.code,
      customerId: order.customerId,
      orderDate: moment(order.orderDate),
      status: order.status,
      items: order.items,
    });
    setVisible(true);
  };

  const handleSubmit = async () => {
    const v = await form.validateFields();

    const code = String(v.code || '').trim();
    const duplicate = orders.some((o) => o.code === code && o.id !== editing?.id);
    if (duplicate) {
      message.error('Ma don hang bi trung');
      return;
    }

    const items: OrderItem[] = (v.items || []).map((x: any) => ({
      productId: x.productId,
      quantity: Number(x.quantity || 1),
    }));

    const total = calcTotal(items);
    const payload: Order = {
      id: editing?.id || uid(),
      code,
      customerId: v.customerId,
      orderDate: v.orderDate.format('YYYY-MM-DD'),
      items,
      total,
      status: v.status,
    };

    const next = editing
      ? orders.map((o) => (o.id === editing.id ? payload : o))
      : [payload, ...orders];

    setOrders(next);
    saveOrders(next);
    setVisible(false);
    message.success(editing ? 'Cập nhật thành công' : 'Thêm mới thành công');
  };

  const cancelOrder = (order: Order) => {
    if (order.status !== 'CHO_XAC_NHAN') {
      message.error('Chỉ có thể hủy đơn ở trạng thái Chờ xác nhận');
      return;
    }
    const next = orders.map((o) => (o.id === order.id ? { ...o, status: 'HUY' as OrderStatus } : o));
    setOrders(next);
    saveOrders(next);
    message.success('Đã hủy đơn');
  };

  const viewData = useMemo(() => {
    let data = [...orders];

    const kw = keyword.trim().toLowerCase();
    if (kw) {
      data = data.filter(
        (o) =>
          o.code.toLowerCase().includes(kw) ||
          (customerMap[o.customerId] || '').toLowerCase().includes(kw),
      );
    }

    if (filterStatus !== 'ALL') {
      data = data.filter((o) => o.status === filterStatus);
    }

    data.sort((a, b) => {
      if (sortBy === 'DATE_DESC') return moment(b.orderDate).valueOf() - moment(a.orderDate).valueOf();
      if (sortBy === 'DATE_ASC') return moment(a.orderDate).valueOf() - moment(b.orderDate).valueOf();
      if (sortBy === 'TOTAL_DESC') return b.total - a.total;
      return a.total - b.total;
    });

    return data;
  }, [orders, keyword, filterStatus, sortBy, customerMap]);

  return (
    <Card
      title="KTGK - Quản lý đơn hàng"
      extra={<Button type="primary" onClick={openCreate}>Thêm đơn hàng</Button>}
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo mã đơn hoặc khách hàng"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 280 }}
        />
        <Select
          style={{ width: 180 }}
          value={filterStatus}
          onChange={(v) => setFilterStatus(v)}
          options={[
            { label: 'Tất cả trạng thái', value: 'ALL' },
            ...Object.keys(STATUS_LABEL).map((k) => ({
              label: STATUS_LABEL[k as OrderStatus],
              value: k,
            })),
          ]}
        />
        <Select
          style={{ width: 180 }}
          value={sortBy}
          onChange={(v) => setSortBy(v)}
          options={[
            { label: 'Ngày đặt mới -> cũ', value: 'DATE_DESC' },
            { label: 'Ngày đặt cũ -> mới', value: 'DATE_ASC' },
            { label: 'Tổng tiền cao -> thấp', value: 'TOTAL_DESC' },
            { label: 'Tổng tiền thấp -> cao', value: 'TOTAL_ASC' },
          ]}
        />
      </Space>

      <Table
        rowKey="id"
        dataSource={viewData}
        pagination={{ pageSize: 8 }}
        columns={[
          { title: 'Mã đơn hàng', dataIndex: 'code' },
          {
            title: 'Khách hàng',
            render: (_, r: Order) => customerMap[r.customerId] || '-',
          },
          { title: 'Ngày đặt', dataIndex: 'orderDate' },
          {
            title: 'Tổng tiền',
            dataIndex: 'total',
            render: (v: number) => `${v.toLocaleString()} VND`,
          },
          {
            title: 'Trạng thái',
            render: (_, r: Order) => (
              <Tag color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Tag>
            ),
          },
          {
            title: 'Thao tác',
            render: (_, r: Order) => (
              <Space>
                <Button size="small" onClick={() => openEdit(r)}>Sửa</Button>
                <Popconfirm
                  title="Bạn chắc chắn muốn hủy đơn?"
                  onConfirm={() => cancelOrder(r)}
                >
                  <Button size="small" danger>Hủy đơn</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        visible={visible}
        onCancel={() => setVisible(false)}
        onOk={handleSubmit}
        title={editing ? 'Chỉnh sửa đơn hàng' : 'Thêm đơn hàng'}
        width={900}
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} align="start">
            <Form.Item
              name="code"
              label="Mã đơn hàng"
              rules={[{ required: true, message: 'Không được để trống mã đơn' }]}
            >
              <Input style={{ width: 180 }} />
            </Form.Item>

            <Form.Item
              name="customerId"
              label="Khách hàng"
              rules={[{ required: true, message: 'Chọn khách hàng' }]}
            >
              <Select
                style={{ width: 220 }}
                options={CUSTOMERS.map((c) => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>

            <Form.Item
              name="orderDate"
              label="Ngày đặt"
              rules={[{ required: true, message: 'Chọn ngày đặt' }]}
            >
              <DatePicker />
            </Form.Item>

            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: 'Chọn trạng thái' }]}
            >
              <Select
                style={{ width: 180 }}
                options={Object.keys(STATUS_LABEL).map((k) => ({
                  label: STATUS_LABEL[k as OrderStatus],
                  value: k,
                }))}
              />
            </Form.Item>
          </Space>

          <Form.List name="items" rules={[{ validator: async (_, value) => {
            if (!value || value.length === 0) throw new Error('Phải có ít nhất 1 sản phẩm');
          }}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((f) => (
                  <Space key={f.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item
                      name={[f.name, 'productId']}
                      rules={[{ required: true, message: 'Chọn sản phẩm' }]}
                    >
                      <Select
                        style={{ width: 260 }}
                        placeholder="Sản phẩm"
                        options={PRODUCTS.map((p) => ({
                          label: `${p.name} - ${p.price.toLocaleString()} VND`,
                          value: p.id,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name={[f.name, 'quantity']}
                      rules={[{ required: true, message: 'Nhập số lượng' }]}
                    >
                      <InputNumber min={1} />
                    </Form.Item>
                    <Button danger onClick={() => remove(f.name)}>Xóa</Button>
                  </Space>
                ))}
                <Button onClick={() => add({ quantity: 1 })}>Thêm sản phẩm</Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Card>
  );
};

export default KTGKOrderPage;