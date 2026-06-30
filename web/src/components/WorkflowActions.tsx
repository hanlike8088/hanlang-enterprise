import { useState, useEffect } from 'react';
import { Button, Space, message, Popconfirm, Spin } from 'antd';
import { workflowApi } from '../services/workflow';

interface Transition {
  id: string;
  transitionName: string;
  requiredPerm?: string;
  toState: { stateCode: string; stateName: string };
}

interface Props {
  module: string;
  docId: string;
  docCode: string;
  docType: string;
  currentStatus: string;
  onTransitionDone?: () => void;
}

export default function WorkflowActions({ module, docId, docCode, docType, currentStatus, onTransitionDone }: Props) {
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);

  const fetchTransitions = async () => {
    if (!currentStatus) return;
    setLoading(true);
    try {
      const data = await workflowApi.getTransitions(module, currentStatus);
      setTransitions(Array.isArray(data) ? data : []);
    } catch {
      setTransitions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransitions();
  }, [module, currentStatus]);

  const execute = async (transition: Transition) => {
    setExecuting(transition.id);
    try {
      await workflowApi.execute({
        module,
        docType,
        docId,
        docCode,
        fromStatus: currentStatus,
        transitionId: transition.id,
        requestedBy: localStorage.getItem('user')
          ? JSON.parse(localStorage.getItem('user') || '{}').name || 'system'
          : 'system',
      });
      message.success('状态已更新为: ' + transition.toState.stateName);
      onTransitionDone?.();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '操作失败');
    } finally {
      setExecuting(null);
    }
  };

  if (loading) return <Spin size="small" />;
  if (transitions.length === 0) return null;

  return (
    <Space size={4} wrap>
      {transitions.map((t) => (
        <Popconfirm
          key={t.id}
          title={'确认执行「' + t.transitionName + '」？'}
          onConfirm={() => execute(t)}
        >
          <Button
            type="link"
            size="small"
            loading={executing === t.id}
            style={{ color: t.requiredPerm ? '#fa541c' : undefined }}
          >
            {t.transitionName}{t.requiredPerm ? ' *' : ''}
          </Button>
        </Popconfirm>
      ))}
    </Space>
  );
}
