import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type PostStatus = 'draft' | 'published';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string; // markdown
  coverUrl: string;
  tags: string[];
  author: string;
  createdAt: string; // ISO
  status: PostStatus;
  views: number;
}

interface BlogTagItem {
  id: string;
  name: string;
}

interface AuthorProfile {
  avatar: string;
  name: string;
  bio: string;
  skills: string[];
  socials: { label: string; url: string }[];
}

const POSTS_KEY = 'th07_blog_posts_v1';
const TAGS_KEY = 'th07_blog_tags_v1';

const AUTHOR: AuthorProfile = {
  avatar: 'https://i.pravatar.cc/180?img=12',
  name: 'Nguyen Van A',
  bio: 'Frontend Developer, thích chia sẻ kinh nghiệm lập trình web.',
  skills: ['React', 'TypeScript', 'UmiJS', 'Ant Design'],
  socials: [
    { label: 'GitHub', url: 'https://github.com' },
    { label: 'Facebook', url: 'https://facebook.com' },
  ],
};

const SEED_TAGS: BlogTagItem[] = [
  { id: 't1', name: 'React' },
  { id: 't2', name: 'TypeScript' },
  { id: 't3', name: 'UmiJS' },
  { id: 't4', name: 'UI' },
];

const SEED_POSTS: BlogPost[] = Array.from({ length: 16 }).map((_, i) => ({
  id: `p${i + 1}`,
  title: `Bài viết số ${i + 1}`,
  slug: `bai-viet-so-${i + 1}`,
  summary: `Tóm tắt ngắn gọn cho bài viết ${i + 1}`,
  content: `# Bài viết ${i + 1}

Nội dung markdown cho bài viết ${i + 1}.

- Ý 1
- Ý 2
- Ý 3`,
  coverUrl: `https://picsum.photos/seed/blog-${i + 1}/600/300`,
  tags: [SEED_TAGS[i % 4].name, SEED_TAGS[(i + 1) % 4].name],
  author: 'Nguyễn Văn An',
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  status: i % 5 === 0 ? 'draft' : 'published',
  views: Math.floor(Math.random() * 100),
}));

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function initData() {
  const p = localStorage.getItem(POSTS_KEY);
  const t = localStorage.getItem(TAGS_KEY);
  if (!p) localStorage.setItem(POSTS_KEY, JSON.stringify(SEED_POSTS));
  if (!t) localStorage.setItem(TAGS_KEY, JSON.stringify(SEED_TAGS));
}

function getPosts(): BlogPost[] {
  return safeParse<BlogPost[]>(localStorage.getItem(POSTS_KEY), []);
}

function savePosts(posts: BlogPost[]) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

function getTags(): BlogTagItem[] {
  return safeParse<BlogTagItem[]>(localStorage.getItem(TAGS_KEY), []);
}

function saveTags(tags: BlogTagItem[]) {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
}

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const PAGE_SIZE = 9;

const TH07BlogOneFilePage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<BlogTagItem[]>([]);
  const [activeTab, setActiveTab] = useState('home');

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 300);
  const [page, setPage] = useState(1);

  const [detailSlug, setDetailSlug] = useState<string>('');

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postForm] = Form.useForm();

  const [postKeyword, setPostKeyword] = useState('');
  const [postStatusFilter, setPostStatusFilter] = useState<'all' | PostStatus>('all');

  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<BlogTagItem | null>(null);
  const [tagForm] = Form.useForm();

  useEffect(() => {
    initData();
    const p = getPosts();
    const t = getTags();
    setPosts(p);
    setTags(t);
    const firstPublished = p.find((x) => x.status === 'published');
    setDetailSlug(firstPublished?.slug || p[0]?.slug || '');
  }, []);

  const publishedPosts = useMemo(() => posts.filter((p) => p.status === 'published'), [posts]);

  const allTagNamesOnPublished = useMemo(() => {
    const s = new Set<string>();
    publishedPosts.forEach((p) => p.tags.forEach((tg) => s.add(tg)));
    return Array.from(s);
  }, [publishedPosts]);

  const homeFiltered = useMemo(() => {
    const kw = debouncedSearch.trim().toLowerCase();
    return publishedPosts.filter((p) => {
      const okTag = selectedTag ? p.tags.includes(selectedTag) : true;
      const okKeyword =
        !kw ||
        p.title.toLowerCase().includes(kw) ||
        p.summary.toLowerCase().includes(kw) ||
        p.author.toLowerCase().includes(kw);
      return okTag && okKeyword;
    });
  }, [publishedPosts, selectedTag, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [selectedTag, debouncedSearch]);

  const homePaged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return homeFiltered.slice(start, start + PAGE_SIZE);
  }, [homeFiltered, page]);

  const detailPost = useMemo(() => posts.find((p) => p.slug === detailSlug), [posts, detailSlug]);

  const relatedPosts = useMemo(() => {
    if (!detailPost) return [];
    return publishedPosts
      .filter(
        (p) => p.id !== detailPost.id && p.tags.some((tg) => detailPost.tags.includes(tg)),
      )
      .slice(0, 4);
  }, [publishedPosts, detailPost]);

  const increaseView = (slug: string) => {
    const idx = posts.findIndex((p) => p.slug === slug);
    if (idx === -1) return;
    const next = [...posts];
    next[idx] = { ...next[idx], views: next[idx].views + 1 };
    setPosts(next);
    savePosts(next);
  };

  const openDetail = (slug: string) => {
    setDetailSlug(slug);
    setActiveTab('detail');
    increaseView(slug);
  };

  const postAdminFiltered = useMemo(() => {
    const kw = postKeyword.trim().toLowerCase();
    return posts.filter((p) => {
      const okTitle = !kw || p.title.toLowerCase().includes(kw);
      const okStatus = postStatusFilter === 'all' || p.status === postStatusFilter;
      return okTitle && okStatus;
    });
  }, [posts, postKeyword, postStatusFilter]);

  const openCreatePost = () => {
    setEditingPost(null);
    postForm.setFieldsValue({
      title: '',
      slug: '',
      summary: '',
      content: '',
      coverUrl: '',
      tags: [],
      status: 'draft',
      author: 'Nguyen Van A',
    });
    setPostModalOpen(true);
  };

  const openEditPost = (post: BlogPost) => {
    setEditingPost(post);
    postForm.setFieldsValue({
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      content: post.content,
      coverUrl: post.coverUrl,
      tags: post.tags,
      status: post.status,
      author: post.author,
    });
    setPostModalOpen(true);
  };

  const savePostFromForm = async () => {
    const v = await postForm.validateFields();
    const slug = String(v.slug || '').trim();
    const duplicatedSlug = posts.some((p) => p.slug === slug && p.id !== editingPost?.id);
    if (duplicatedSlug) {
      message.error('Slug đã tồn tại');
      return;
    }

    const now = new Date().toISOString();
    let next: BlogPost[];
    if (editingPost) {
      next = posts.map((p) =>
        p.id === editingPost.id
          ? {
              ...p,
              ...v,
              slug,
            }
          : p,
      );
    } else {
      const newPost: BlogPost = {
        id: `p_${Date.now()}`,
        title: v.title,
        slug,
        summary: v.summary,
        content: v.content,
        coverUrl: v.coverUrl,
        tags: v.tags || [],
        status: v.status,
        author: v.author,
        createdAt: now,
        views: 0,
      };
      next = [newPost, ...posts];
    }

    setPosts(next);
    savePosts(next);
    setPostModalOpen(false);
    message.success(editingPost ? 'Cập nhật bài viết thành công' : 'Thêm bài viết thành công');
  };

  const deletePost = (id: string) => {
    const next = posts.filter((p) => p.id !== id);
    setPosts(next);
    savePosts(next);
    message.success('Đã xóa bài viết');
  };

  const tagUsage = useMemo(() => {
    const map: Record<string, number> = {};
    posts.forEach((p) => p.tags.forEach((t) => (map[t] = (map[t] || 0) + 1)));
    return map;
  }, [posts]);

  const openCreateTag = () => {
    setEditingTag(null);
    tagForm.setFieldsValue({ name: '' });
    setTagModalOpen(true);
  };

  const openEditTag = (tag: BlogTagItem) => {
    setEditingTag(tag);
    tagForm.setFieldsValue({ name: tag.name });
    setTagModalOpen(true);
  };

  const saveTagFromForm = async () => {
    const v = await tagForm.validateFields();
    const name = String(v.name || '').trim();
    if (!name) return;

    const duplicated = tags.some(
      (t) => t.name.toLowerCase() === name.toLowerCase() && t.id !== editingTag?.id,
    );
    if (duplicated) {
      message.error('Tên thẻ đã tồn tại');
      return;
    }

    let nextTags: BlogTagItem[];
    let nextPosts = [...posts];

    if (editingTag) {
      const oldName = editingTag.name;
      nextTags = tags.map((t) => (t.id === editingTag.id ? { ...t, name } : t));
      nextPosts = nextPosts.map((p) => ({
        ...p,
        tags: p.tags.map((tg) => (tg === oldName ? name : tg)),
      }));
    } else {
      nextTags = [{ id: `t_${Date.now()}`, name }, ...tags];
    }

    setTags(nextTags);
    saveTags(nextTags);

    setPosts(nextPosts);
    savePosts(nextPosts);

    setTagModalOpen(false);
    message.success(editingTag ? 'Cập nhật thẻ thành công' : 'Thêm thẻ thành công');
  };

  const deleteTag = (tag: BlogTagItem) => {
    if ((tagUsage[tag.name] || 0) > 0) {
      message.error('Thẻ đang được sử dụng, không thể xóa');
      return;
    }
    const next = tags.filter((t) => t.id !== tag.id);
    setTags(next);
    saveTags(next);
    message.success('Đã xóa thẻ');
  };

  return (
    <Card>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="1. Trang chủ" key="home">
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Input.Search
              placeholder="Tìm kiếm bài viết (debounce 300ms)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />

            <Space wrap>
              <Tag
                color={selectedTag === null ? 'processing' : 'default'}
                onClick={() => setSelectedTag(null)}
                style={{ cursor: 'pointer' }}
              >
                Tất cả
              </Tag>
              {allTagNamesOnPublished.map((tg) => (
                <Tag
                  key={tg}
                  color={selectedTag === tg ? 'processing' : 'default'}
                  onClick={() => setSelectedTag(tg)}
                  style={{ cursor: 'pointer' }}
                >
                  {tg}
                </Tag>
              ))}
            </Space>

            <Row gutter={[16, 16]}>
              {homePaged.map((p) => (
                <Col xs={24} sm={12} md={8} key={p.id}>
                  <Card
                    hoverable
                    cover={
                      <img
                        src={p.coverUrl}
                        alt={p.title}
                        style={{ height: 180, objectFit: 'cover' }}
                      />
                    }
                    onClick={() => openDetail(p.slug)}
                  >
                    <Card.Meta
                      title={p.title}
                      description={
                        <>
                          <div>{p.summary}</div>
                          <div style={{ marginTop: 8, color: '#666' }}>
                            {new Date(p.createdAt).toLocaleDateString()} - {p.author}
                          </div>
                          <Space wrap style={{ marginTop: 8 }}>
                            {p.tags.map((tg) => (
                              <Tag key={tg}>{tg}</Tag>
                            ))}
                          </Space>
                        </>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={homeFiltered.length}
              onChange={setPage}
              showSizeChanger={false}
            />
          </Space>
        </Tabs.TabPane>

        <Tabs.TabPane tab="2. Chi tiết bài viết" key="detail">
          {!detailPost ? (
            <Card>Không tìm thấy bài viết</Card>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Button onClick={() => setActiveTab('home')}>Quay lại danh sách</Button>

              <Card>
                <Typography.Title level={2}>{detailPost.title}</Typography.Title>
                <Space wrap>
                  <span>{new Date(detailPost.createdAt).toLocaleDateString()}</span>
                  <span>Tác giả: {detailPost.author}</span>
                  <span>Lượt xem: {detailPost.views}</span>
                </Space>

                <div style={{ marginTop: 8 }}>
                  {detailPost.tags.map((tg) => (
                    <Tag key={tg}>{tg}</Tag>
                  ))}
                </div>

                <Divider />
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{detailPost.content}</ReactMarkdown>
              </Card>

              <Card title="Bài viết liên quan">
                {relatedPosts.length === 0 && <div>Không có bài viết liên quan</div>}
                {relatedPosts.map((r) => (
                  <div key={r.id} style={{ marginBottom: 8 }}>
                    <a onClick={() => openDetail(r.slug)}>{r.title}</a>
                  </div>
                ))}
              </Card>
            </Space>
          )}
        </Tabs.TabPane>

        <Tabs.TabPane tab="3. Giới thiệu" key="about">
          <Card>
            <Space direction="vertical" size={12}>
              <Avatar size={96} src={AUTHOR.avatar} />
              <Typography.Title level={4} style={{ margin: 0 }}>
                {AUTHOR.name}
              </Typography.Title>
              <Typography.Paragraph>{AUTHOR.bio}</Typography.Paragraph>
              <div>
                {AUTHOR.skills.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
              <Space>
                {AUTHOR.socials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                ))}
              </Space>
            </Space>
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab="4. Quản lý bài viết" key="admin-posts">
          <Card
            extra={
              <Button type="primary" onClick={openCreatePost}>
                Thêm bài viết
              </Button>
            }
          >
            <Space style={{ marginBottom: 12 }}>
              <Input
                placeholder="Tìm theo tiêu đề"
                value={postKeyword}
                onChange={(e) => setPostKeyword(e.target.value)}
                style={{ width: 260 }}
              />
              <Select
                value={postStatusFilter}
                onChange={setPostStatusFilter}
                style={{ width: 180 }}
                options={[
                  { label: 'Tất cả', value: 'all' },
                  { label: 'Nháp', value: 'draft' },
                  { label: 'Đã đăng', value: 'published' },
                ]}
              />
            </Space>

            <Table
              rowKey="id"
              dataSource={postAdminFiltered}
              columns={[
                { title: 'Tiêu đề', dataIndex: 'title' },
                {
                  title: 'Trạng thái',
                  dataIndex: 'status',
                  render: (v: PostStatus) => (
                    <Tag color={v === 'published' ? 'green' : 'gold'}>
                      {v === 'published' ? 'Đã đăng' : 'Nháp'}
                    </Tag>
                  ),
                },
                {
                  title: 'Thẻ',
                  dataIndex: 'tags',
                  render: (arr: string[]) => arr.map((tg) => <Tag key={tg}>{tg}</Tag>),
                },
                { title: 'Lượt xem', dataIndex: 'views' },
                {
                  title: 'Ngày tạo',
                  dataIndex: 'createdAt',
                  render: (v: string) => new Date(v).toLocaleDateString(),
                },
                {
                  title: 'Hành động',
                  render: (_, r: BlogPost) => (
                    <Space>
                      <Button size="small" onClick={() => openEditPost(r)}>
                        Sửa
                      </Button>
                      <Popconfirm title="Xóa bài viết?" onConfirm={() => deletePost(r.id)}>
                        <Button size="small" danger>
                          Xóa
                        </Button>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab="5. Quản lý thẻ" key="admin-tags">
          <Card
            extra={
              <Button type="primary" onClick={openCreateTag}>
                Thêm thẻ
              </Button>
            }
          >
            <Table
              rowKey="id"
              dataSource={tags}
              columns={[
                { title: 'Tên thẻ', dataIndex: 'name' },
                {
                  title: 'Số bài viết sử dụng',
                  render: (_, r: BlogTagItem) => tagUsage[r.name] || 0,
                },
                {
                  title: 'Hành động',
                  render: (_, r: BlogTagItem) => (
                    <Space>
                      <Button size="small" onClick={() => openEditTag(r)}>
                        Sửa
                      </Button>
                      <Popconfirm title="Xóa thẻ?" onConfirm={() => deleteTag(r)}>
                        <Button size="small" danger>
                          Xóa
                        </Button>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </Tabs.TabPane>
      </Tabs>

      <Modal
        open={postModalOpen}
        title={editingPost ? 'Sửa bài viết' : 'Thêm bài viết'}
        onCancel={() => setPostModalOpen(false)}
        onOk={savePostFromForm}
        width={900}
      >
        <Form form={postForm} layout="vertical">
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="summary" label="Tóm tắt" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="content" label="Nội dung (Markdown)" rules={[{ required: true }]}>
            <Input.TextArea rows={8} />
          </Form.Item>
          <Form.Item name="coverUrl" label="Ảnh đại diện URL" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tags" label="Thẻ" rules={[{ required: true }]}>
            <Select mode="multiple" options={tags.map((t) => ({ label: t.name, value: t.name }))} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Nháp', value: 'draft' },
                { label: 'Đã đăng', value: 'published' },
              ]}
            />
          </Form.Item>
          <Form.Item name="author" label="Tác giả" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={tagModalOpen}
        title={editingTag ? 'Sửa thẻ' : 'Thêm thẻ'}
        onCancel={() => setTagModalOpen(false)}
        onOk={saveTagFromForm}
      >
        <Form form={tagForm} layout="vertical">
          <Form.Item name="name" label="Tên thẻ" rules={[{ required: true, message: 'Nhập tên thẻ' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default TH07BlogOneFilePage;