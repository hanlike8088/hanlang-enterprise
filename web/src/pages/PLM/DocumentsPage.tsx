 import { useEffect, useState } from 'react';
 import { Table, Button, Select, Space, Card, Tag, message, Popconfirm, Input } from 'antd';
 import { DeleteOutlined, FilePdfOutlined, ReloadOutlined } from '@ant-design/icons';
 import { plmApi } from '../../services/api';
import { UploadOutlined } from '@ant-design/icons';
 
 const typeColors: Record<string, string> = {
   '专利': 'red', '图纸': 'blue', '工艺文件': 'green', '检验标准': 'orange',
 };
 
 export default function DocumentsPage() {
   const [documents, setDocuments] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [docType, setDocType] = useState<string | undefined>(undefined);
 
   const fetch = async () => {
     setLoading(true);
     try {
       const data = await plmApi.getDocuments(undefined, docType);
       setDocuments(data);
     } finally { setLoading(false); }
   };
   useEffect(() => { fetch(); }, [docType]);
 
   const remove = async (id: string) => {
     await plmApi.deleteDocument(id);
     message.success('文档已删除');
     fetch();
   };
 
   const formatSize = (bytes: number) => {
     if (bytes < 1024) return `${bytes} B`;
     if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
     return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
   };
 
   const columns = [
     { title: '鏂囨。缂栫爜', dataIndex: 'docCode', key: 'docCode', width: 150 },
     {
       title: '鏂囨。鍚嶇О', dataIndex: 'docName', key: 'docName', ellipsis: true,
       render: (name: string, r: any) => (
         <a href={`file:///${r.filePath.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer">
           <FilePdfOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />{name}
         </a>
       ),
     },
     {
       title: '绫诲瀷', dataIndex: 'docType', key: 'docType', width: 100,
       render: (t: string) => <Tag color={typeColors[t] || 'default'}>{t}</Tag>,
     },
     { title: '鏂囦欢澶у皬', dataIndex: 'fileSize', key: 'fileSize', width: 100, render: (s: number) => formatSize(s) },
     { title: '鐗堟湰', dataIndex: 'version', key: 'version', width: 80 },
     {
       title: '鎿嶄綔', key: 'action', width: 80,
       render: (_: any, r: any) => (
         <Popconfirm title="纭畾鍒犻櫎璇ユ枃妗ｏ紵" onConfirm={() => remove(r.id)}>
           <Button type="link" size="small" danger icon={<DeleteOutlined />}>鍒犻櫎</Button>
         </Popconfirm>
       ),
     },
   ];
 
   return (
     <Card
        title="PLM 文档管理"
       extra={
         <Space>
           <Button type="primary" icon={<UploadOutlined />} onClick={async () => {
             const res = await plmApi.importPatents();
             message.success('Patents imported successfully');
             fetch();
           }}>Import Patents</Button>
           <Select
             allowClear
              placeholder="按类型筛选"
             style={{ width: 140 }}
             value={docType}
             onChange={setDocType}
             options={['专利', '图纸', '工艺文件', '检验标准'].map(t => ({ value: t, label: t }))}
           />
           <Button icon={<ReloadOutlined />} onClick={fetch}>鍒锋柊</Button>
         </Space>
       }
     >
       <Table dataSource={documents} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} />
     </Card>
   );
 }
 
