import { useState, useEffect } from 'react';
import { Steps, Button, Space, message, Card, Tag } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { workflowApi } from '../services/workflow';

interface WorkflowState {
  stateCode: string;
  stateName: string;
  isStart: boolean;
  isEnd: boolean;
  sortOrder: number;
}

interface WorkflowTransition {
  id: string;
  transitionName: string;
  requiredPerm?: string;
  sortOrder: number;
  toState: WorkflowState;
}

interface Props {
  module: string;
  currentStatus: string;
  docId: string;
  docCode: string;
  docType: string;
  onTransitioned?: () => void;
}

export default function WorkflowPanel({ module, currentStatus, docId, docCode, docType, onTransitioned }: Props) {
  const [states, setStates] = useState<WorkflowState[]>([]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await workflowApi.getSummary(module);
        setStates(data.states || []);
      } catch (e) {
        console.warn('Failed to load workflow states:', e);
      }
      try {
        const t = await workflowApi.getTransitions(module, currentStatus);
        setTransitions(Array.isArray(t) ? t : []);
      } catch (e) {
        console.warn('Failed to load transitions:', e);
      }
    };
    fetchData();
  }, [module, currentStatus]);

  const getStepStatus = (stateCode: string, stateNames: string[], currentIdx: number, thisIdx: number) => {
    if (stateCode === currentStatus) return 'process';
    if (thisIdx < currentIdx) return 'finish';
    return 'wait';
  };

  const execute = async (transition: WorkflowTransition) => {
    setExecuting(transition.id);
    try {
      await workflowApi.execute({
        module,
        docType,
        docId,
        docCode,
        fromStatus: currentStatus,
        transitionId: transition.id,
        requestedBy: (() => {
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.name || user.username || 'system';
          } catch { return 'system'; }
        })(),
      });
      message.success('状态已更新');
      onTransitioned?.();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '操作失败');
    } finally {
      setExecuting(null);
    }
  };

  const stateNames = states.map((s) => s.stateName);
  const currentIdx = stateNames.indexOf(currentStatus);

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Steps
        size="small"
        current={currentIdx >= 0 ? currentIdx : 0}
        status={currentIdx >= 0 ? 'process' : 'wait'}
        items={states.map((s, i) => ({
          title: s.stateName,
          status: getStepStatus(s.stateCode, stateNames, currentIdx, i) as 'wait' | 'process' | 'finish',
        }))}
      />
      {transitions.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <Space wrap>
            {transitions.map((t) => (
              <Button
                key={t.id}
                type="primary"
                size="small"
                icon={executing === t.id ? <LoadingOutlined /> : <CheckCircleOutlined />}
                loading={executing === t.id}
                onClick={() => execute(t)}
                danger={!!t.requiredPerm}
              >
                {t.transitionName}
                {t.requiredPerm && (
                  <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>
                    需审批
                  </Tag>
                )}
              </Button>
            ))}
          </Space>
        </div>
      )}
    </Card>
  );
}
