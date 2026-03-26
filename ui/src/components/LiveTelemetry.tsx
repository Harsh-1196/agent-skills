import React from 'react';
import { motion } from 'framer-motion';

const LiveTelemetry: React.FC = () => {
  const logs = [
    { time: '14:22:05', msg: 'CPU_TEMP: 42.5C', type: 'info' },
    { time: '14:22:05', msg: 'DISK_IO: 855MB/s', type: 'info' },
    { time: '14:22:06', msg: 'NET_SYNC: Latency 2ms', type: 'info' },
    { time: '14:22:06', msg: 'NEURAL_LATENCY: 12ms', type: 'info' },
    { time: '14:22:07', msg: 'PKT_RCV: Logic_Gate_72', type: 'info' },
    { time: '14:22:08', msg: 'WARN: Buffer overflow threat at Node_Z', type: 'warn' },
    { time: '14:22:08', msg: 'MITIGATING: Re-routing to redundant path', type: 'info' },
    { time: '14:22:09', msg: 'RESOLVED: Stability 100%', type: 'success' },
  ];

  return (
    <div className="flex-1 bg-black border border-white/5 mt-6 p-4 font-mono overflow-y-auto relative hidden xl:block">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[var(--color-primary-accent)] shadow-[0_0_5px_#00F0FF]"></div>
        <div className="text-[10px] text-[var(--color-primary-accent)] uppercase tracking-widest font-semibold">Live_System_Telemetry</div>
      </div>
      
      <div className="space-y-1.5">
        {logs.map((log, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`text-[10px] tracking-wide ${
              log.type === 'warn' ? 'text-red-400' : 
              log.type === 'success' ? 'text-gray-300' : 
              'text-gray-400'
            }`}
          >
            <span className="text-gray-600 mr-2">[{log.time}]</span>
            {log.msg}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LiveTelemetry;
