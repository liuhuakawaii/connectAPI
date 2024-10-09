import React, { useEffect } from 'react';
import { render, act, screen } from '@testing-library/react';
import { useWebSocket } from '../src/utils/testwebsoket';
import { io } from 'socket.io-client';

jest.mock('socket.io-client');

// Mock WebSocket events
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  off: jest.fn(),
};

beforeEach(() => {
  io.mockReturnValue(mockSocket); //确保 io 返回我们的 mockSocket。
  jest.clearAllMocks();//清除之前所有的 mock 调用记录。
  jest.useFakeTimers();//使用假的计时器来控制时间流逝。
});

const TestComponent = ({ subKey, jobid }) => {
  const { status, connect, setReconnectAttempts, onMessage } = useWebSocket('/test');

  useEffect(() => {
    setReconnectAttempts(0);
    connect(subKey, jobid);
    onMessage('message', (data, res) => {
      // Handle message
    });
  }, [subKey, jobid, onMessage]);

  return <div data-testid="status">{status}</div>;
};

//用于分组相关的测试。
describe('useWebSocket', () => {
  //单个测试的描述和实现。
  it('should handle connection and reconnection', async () => {
    render(<TestComponent subKey="subKey" jobid="jobid" />);

    act(() => {
      // Simulate connection
      mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
    });

    expect(screen.getByTestId('status').textContent).toBe('connected');
    expect(mockSocket.emit).toHaveBeenCalledWith('query', 'jobid');

    // Simulate message with jobStatus "Failed"
    act(() => {
      const messageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
      messageHandler({ jobStatus: 'Failed' }, {});
    });

    expect(screen.getByTestId('status').textContent).toBe('failed');
    act(() => {
      const messageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
      messageHandler({ jobStatus: 'Failed' }, {});
    });
    expect(screen.getByTestId('status').textContent).toBe('failed');
    act(() => {
      const messageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
      messageHandler({ jobStatus: 'Failed' }, {});
    });
    expect(screen.getByTestId('status').textContent).toBe('failed');
    act(() => {
      const messageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
      messageHandler({ jobStatus: 'Failed' }, {});
    });
    expect(screen.getByTestId('status').textContent).toBe('failed');
    act(() => {
      const messageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
      messageHandler({ jobStatus: 'Failed' }, {});
    });
    expect(screen.getByTestId('status').textContent).toBe('failed');


    act(() => {
      jest.advanceTimersByTime(1500);
    });


    expect(mockSocket.connect).toHaveBeenCalledTimes();



  });
});