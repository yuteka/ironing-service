import React, { useState } from 'react';
import { Loader2, AlertCircle, Eye, TrendingUp, PieChart, Users, Calendar, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import MetricCards from '../components/MetricCards';
import { formatPhone } from '../utils/formatPhone';
import SmartTooltip from '../components/SmartTooltip';

const TrendChart = ({ title, dataDays, dataValues, chartTimeframe, setChartTimeframe, gradientColors, strokeColors, formatValue, icon: Icon }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  const maxValue = Math.max(...dataValues, 5) * 1.1; 
  const chartHeight = 120;
  const chartWidth = 500;
  
  const points = dataValues.map((val, idx) => {
    const x = dataValues.length > 1 ? (idx / (dataValues.length - 1)) * chartWidth : 0;
    const y = chartHeight - (val / maxValue) * (chartHeight - 30) - 15;
    return { x, y };
  });

  const getCurvePath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const cp1x = p1.x + (p2.x - p1.x) * 0.4;
      const cp2x = p2.x - (p2.x - p1.x) * 0.4;
      path += ` C ${cp1x} ${p1.y}, ${cp2x} ${p2.y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = getCurvePath(points);
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : '';

  const idSuffix = title.replace(/\s+/g, '');

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', margin: 0 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon size={18} style={{ color: strokeColors[1] }} />
            <span>{chartTimeframe} {title}</span>
          </h3>
          <div style={{ display: 'flex', gap: 4, background: `rgba(226, 232, 240, 0.4)`, padding: 4, borderRadius: 20 }}>
            {['Yearly', 'Weekly', 'Monthly'].map(tf => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                style={{
                  border: 'none',
                  background: chartTimeframe === tf ? strokeColors[1] : 'transparent',
                  color: chartTimeframe === tf ? '#FFF' : 'var(--text-muted)',
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ minHeight: 32, marginBottom: 20 }}>
          {hoveredPoint ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', animation: 'slideIn 0.15s ease' }}>
              <span style={{ color: 'var(--text-muted)' }}>{title.split(' ')[0]} on</span>
              <strong style={{ color: 'var(--text-dark)' }}>{hoveredPoint.date}</strong>:
              <strong style={{ color: strokeColors[1], fontSize: '1.15rem' }}>{formatValue(hoveredPoint.value)}</strong>
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Hover over the chart data points to verify totals.
            </p>
          )}
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 130, overflow: 'visible' }}>
        {hoveredPoint && (
          <div 
            className="chart-tooltip"
            style={{ 
              left: `${(hoveredPoint.x / chartWidth) * 100}%`,
              top: `${(hoveredPoint.y / chartHeight) * 100}px`
            }}
          >
            <div style={{ fontWeight: 700, color: strokeColors[2] }}>
              {formatValue(hoveredPoint.value)}
            </div>
          </div>
        )}

        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`chartGradient-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientColors[0]} stopOpacity="0.4" />
              <stop offset="100%" stopColor={gradientColors[1]} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={`lineGradient-${idSuffix}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={strokeColors[0]} />
              <stop offset="50%" stopColor={strokeColors[1]} />
              <stop offset="100%" stopColor={strokeColors[2]} />
            </linearGradient>
            <filter id={`glow-${idSuffix}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="rgba(226, 232, 240, 0.4)" strokeDasharray="4 4" />
          <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="rgba(226, 232, 240, 0.4)" strokeDasharray="4 4" />
          <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="rgba(226, 232, 240, 0.4)" strokeDasharray="4 4" />
          
          {hoveredPoint && (
            <line 
              x1={hoveredPoint.x} 
              y1={0} 
              x2={hoveredPoint.x} 
              y2={chartHeight} 
              stroke={gradientColors[0]} 
              strokeOpacity="0.4"
              strokeWidth="1.5" 
              strokeDasharray="4 4" 
            />
          )}

          {areaPath && <path d={areaPath} fill={`url(#chartGradient-${idSuffix})`} style={{ transition: 'd 0.3s ease' }} />}
          {linePath && <path d={linePath} fill="none" stroke={`url(#lineGradient-${idSuffix})`} strokeWidth="3.5" strokeLinecap="round" filter={`url(#glow-${idSuffix})`} style={{ transition: 'd 0.3s ease' }} />}
          
          {points.map((p, idx) => (
            <circle 
              key={idx} 
              cx={p.x} 
              cy={p.y} 
              r={hoveredPoint && hoveredPoint.index === idx ? "7" : "4.5"} 
              fill="#ffffff"
              stroke={hoveredPoint && hoveredPoint.index === idx ? strokeColors[0] : strokeColors[1]} 
              strokeWidth={hoveredPoint && hoveredPoint.index === idx ? "3" : "2"} 
              style={{ transition: 'all 0.2s ease', filter: hoveredPoint && hoveredPoint.index === idx ? `url(#glow-${idSuffix})` : 'none' }}
            />
          ))}

          {hoveredPoint && (
            <circle 
              cx={hoveredPoint.x} 
              cy={hoveredPoint.y} 
              r="14" 
              fill="none" 
              stroke={strokeColors[0]} 
              strokeOpacity="0.4"
              strokeWidth="3" 
            />
          )}

          {points.map((p, idx) => {
            const sectionWidth = chartWidth / (dataValues.length - 1 || 1);
            return (
              <rect
                key={`hitbox-${idx}`}
                x={idx === 0 ? 0 : p.x - (sectionWidth / 2)}
                y={0}
                width={sectionWidth}
                height={chartHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint({
                  index: idx,
                  x: p.x,
                  y: p.y,
                  value: dataValues[idx],
                  date: dataDays[idx]
                })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '0 8px' }}>
        {dataDays.map((d, i) => (
          <span key={i} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
};

const BarChart = ({ title, dataDays, dataValues, chartTimeframe, setChartTimeframe, gradientColors, strokeColors, formatValue, icon: Icon }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  const maxValue = Math.max(...dataValues, 5) * 1.1; 
  const chartHeight = 120;
  const chartWidth = 500;
  const numBars = dataValues.length || 1;
  const barSpacing = chartWidth * 0.05; // 5% spacing
  const barWidth = (chartWidth - (barSpacing * (numBars + 1))) / numBars;

  const bars = dataValues.map((val, idx) => {
    const x = barSpacing + idx * (barWidth + barSpacing);
    const h = (val / maxValue) * (chartHeight - 30);
    const y = chartHeight - h - 15;
    return { x, y, w: barWidth, h };
  });

  const idSuffix = title.replace(/\s+/g, '') + 'Bar';

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', margin: 0 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon size={18} style={{ color: strokeColors[1] }} />
            <span>{chartTimeframe} {title}</span>
          </h3>
          <div style={{ display: 'flex', gap: 4, background: `rgba(226, 232, 240, 0.4)`, padding: 4, borderRadius: 20 }}>
            {['Yearly', 'Weekly', 'Monthly'].map(tf => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                style={{
                  border: 'none',
                  background: chartTimeframe === tf ? strokeColors[1] : 'transparent',
                  color: chartTimeframe === tf ? '#FFF' : 'var(--text-muted)',
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ minHeight: 32, marginBottom: 20 }}>
          {hoveredPoint ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', animation: 'slideIn 0.15s ease' }}>
              <span style={{ color: 'var(--text-muted)' }}>{title.split(' ')[0]} on</span>
              <strong style={{ color: 'var(--text-dark)' }}>{hoveredPoint.date}</strong>:
              <strong style={{ color: strokeColors[1], fontSize: '1.15rem' }}>{formatValue(hoveredPoint.value)}</strong>
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Hover over the chart bars to verify totals.
            </p>
          )}
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 130, overflow: 'visible' }}>
        {hoveredPoint && (
          <div 
            className="chart-tooltip"
            style={{ 
              left: `${(hoveredPoint.x + hoveredPoint.w/2) / chartWidth * 100}%`,
              top: `${(hoveredPoint.y / chartHeight) * 100}px`
            }}
          >
            <div style={{ fontWeight: 700, color: strokeColors[2] }}>
              {formatValue(hoveredPoint.value)}
            </div>
          </div>
        )}

        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`barGradient-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientColors[0]} />
              <stop offset="100%" stopColor={gradientColors[1]} stopOpacity="0.7" />
            </linearGradient>
            <filter id={`barGlow-${idSuffix}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="rgba(226, 232, 240, 0.4)" strokeDasharray="4 4" />
          <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="rgba(226, 232, 240, 0.4)" strokeDasharray="4 4" />
          <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="rgba(226, 232, 240, 0.4)" strokeDasharray="4 4" />
          
          {bars.map((b, idx) => {
            const isHovered = hoveredPoint && hoveredPoint.index === idx;
            return (
              <rect 
                key={idx}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill={`url(#barGradient-${idSuffix})`}
                rx={b.w * 0.2} // Rounded tops
                ry={b.w * 0.2}
                style={{ 
                  transition: 'all 0.2s ease', 
                  filter: isHovered ? `url(#barGlow-${idSuffix})` : 'none',
                  opacity: isHovered ? 1 : 0.85
                }}
              />
            );
          })}

          {bars.map((b, idx) => {
            return (
              <rect
                key={`hitbox-${idx}`}
                x={b.x - barSpacing/2}
                y={0}
                width={b.w + barSpacing}
                height={chartHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint({
                  index: idx,
                  x: b.x,
                  y: b.y,
                  w: b.w,
                  value: dataValues[idx],
                  date: dataDays[idx]
                })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '0 8px' }}>
        {dataDays.map((d, i) => (
          <span key={i} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard({ 
  metrics, 
  orders, 
  setSelectedOrder, 
  triggerBulkReady, 
  setActiveTab, 
  loading, 
  loadAllData,
  partners,
  assignPartner,
  updateOrderStatus,
  triggerAutoAssign
}) {
  const [revenueTimeframe, setRevenueTimeframe] = useState('Yearly');
  const [ordersTimeframe, setOrdersTimeframe] = useState('Yearly');
  const [recentBookingsPage, setRecentBookingsPage] = useState(1);
  const bookingsPageSize = 5;

  const totalBookings = orders.length;
  const totalBookingsPages = Math.ceil(totalBookings / bookingsPageSize);
  const indexOfLastBooking = recentBookingsPage * bookingsPageSize;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPageSize;
  const currentBookings = orders.slice(indexOfFirstBooking, indexOfLastBooking);

  const getPageNumbers = (current, total) => {
    const pages = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  // ID formatters — consistent across all modules without hyphens
  const fmtBookingId = (id) => `BK2026${String(id).padStart(4, '0')}`;
  const fmtCustId  = (phone) => `CUS${String(phone).slice(-4)}`;

  const getStatusLabel = (status) => {
    const map = {
      'CONFIRMED': 'Confirmed',
      'PICKUP_ASSIGNED': 'Pickup Assigned',
      'COLLECTED': 'Collected',
      'READY': 'Ready',
      'OUT_FOR_DELIVERY': 'Out for Delivery',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled',
      'REASSIGNMENT_NEEDED': 'Reassignment Needed',
      'Confirmed': 'Confirmed',
      'Pickup Assigned': 'Pickup Assigned',
      'Collected': 'Collected',
      'Ready': 'Ready',
      'Out for Delivery': 'Out for Delivery',
      'Delivered': 'Delivered',
      'Cancelled': 'Cancelled',
      'Reassignment Needed': 'Reassignment Needed'
    };
    return map[status] || status;
  };

  const getStatusClass = (status) => {
    const map = {
      'CONFIRMED': 'confirmed',
      'Confirmed': 'confirmed',
      'PICKUP_ASSIGNED': 'assigned',
      'Pickup Assigned': 'assigned',
      'COLLECTED': 'collected',
      'Collected': 'collected',
      'READY': 'ready',
      'Ready': 'ready',
      'OUT_FOR_DELIVERY': 'ready',
      'Out for Delivery': 'ready',
      'DELIVERED': 'delivered',
      'Delivered': 'delivered',
      'CANCELLED': 'pending',
      'Cancelled': 'pending',
      'REASSIGNMENT_NEEDED': 'pending',
      'Reassignment Needed': 'pending'
    };
    return map[status] || 'confirmed';
  };

  const unreadyIds = orders.filter(o => o.status?.toUpperCase() === 'COLLECTED').map(o => o.id);

  // Helper to generate dynamic colored customer avatars
  const getAvatar = (name) => {
    const letter = name ? name.charAt(0).toUpperCase() : 'C';
    const colors = [
      'linear-gradient(135deg, #0EA5E9, #3B82F6)',
      'linear-gradient(135deg, #10B981, #059669)',
      'linear-gradient(135deg, #8B5CF6, #6D28D9)',
      'linear-gradient(135deg, #EC4899, #BE185D)',
      'linear-gradient(135deg, #F59E0B, #D97706)'
    ];
    // Add safety check in case name is not a string
    const safeName = String(name || '');
    const index = isNaN(safeName.charCodeAt(0)) ? 0 : safeName.charCodeAt(0) % colors.length;
    return (
      <div style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: colors[index],
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '0.85rem'
      }}>
        {letter}
      </div>
    );
  };

  // --- DATA CALCULATIONS FOR ANALYTICS ---

  // 1. Dynamic Revenue (Daily/Weekly/Monthly)
  const getRevenueData = (timeframe) => {
    const days = [];
    const revenue = [];
    const today = new Date();
    
    if (timeframe === 'Yearly') {
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setFullYear(d.getFullYear() - i);
        days.push(d.getFullYear().toString());
        const sum = orders
          .filter(o => {
            if (o.paymentStatus !== 'Paid') return false;
            const up = new Date(o.updatedAt);
            return up.getFullYear() === d.getFullYear();
          })
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        revenue.push(sum);
      }
    } else if (timeframe === 'Weekly') {
      for (let i = 4; i >= 0; i--) {
        const end = new Date();
        end.setDate(end.getDate() - (i * 7));
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        
        days.push(`Week ${5 - i}`);
        const sum = orders
          .filter(o => {
            if (o.paymentStatus !== 'Paid') return false;
            const up = new Date(o.updatedAt);
            return up >= start && up <= end;
          })
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        revenue.push(sum);
      }
    } else if (timeframe === 'Monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        days.push(d.toLocaleDateString(undefined, { month: 'short' }));
        const sum = orders
          .filter(o => {
            if (o.paymentStatus !== 'Paid') return false;
            const up = new Date(o.updatedAt);
            return up.getMonth() === d.getMonth() && up.getFullYear() === d.getFullYear();
          })
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        revenue.push(sum);
      }
    }
    return { days, revenue };
  };

  // 1.5. Dynamic Orders Volume
  const getOrdersData = (timeframe) => {
    const days = [];
    const counts = [];
    const today = new Date();
    
    if (timeframe === 'Yearly') {
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setFullYear(d.getFullYear() - i);
        days.push(d.getFullYear().toString());
        const count = orders.filter(o => {
          const up = new Date(o.createdAt);
          return up.getFullYear() === d.getFullYear();
        }).length;
        counts.push(count);
      }
    } else if (timeframe === 'Weekly') {
      for (let i = 4; i >= 0; i--) {
        const end = new Date();
        end.setDate(end.getDate() - (i * 7));
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        
        days.push(`Week ${5 - i}`);
        const count = orders.filter(o => {
          const up = new Date(o.createdAt);
          return up >= start && up <= end;
        }).length;
        counts.push(count);
      }
    } else if (timeframe === 'Monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        days.push(d.toLocaleDateString(undefined, { month: 'short' }));
        const count = orders.filter(o => {
          const up = new Date(o.createdAt);
          return up.getMonth() === d.getMonth() && up.getFullYear() === d.getFullYear();
        }).length;
        counts.push(count);
      }
    }
    return { days, counts };
  };

  const { days: revDays, revenue: revValues } = getRevenueData(revenueTimeframe);
  const { days: ordDays, counts: ordValues } = getOrdersData(ordersTimeframe);

  // 2. Garment Breakdown
  const getGarmentData = () => {
    const counts = { Shirt: 0, Pant: 0, Saree: 0, 'T-Shirt': 0, Coat: 0 };
    orders.forEach(o => {
      if (o.items) {
        o.items.forEach(item => {
          if (counts[item.itemType] !== undefined) {
            counts[item.itemType] += item.quantity;
          }
        });
      }
    });
    return counts;
  };

  const garmentCounts = getGarmentData();
  const totalGarments = Object.values(garmentCounts).reduce((a, b) => a + b, 0) || 1;

  // 3. Partner Workload Distribution
  const getStaffDistribution = () => {
    return partners
      .filter(p => p.active)
      .map(p => {
        const activeCount = orders.filter(o => o.partnerId === p.id && o.status !== 'Delivered' && o.status !== 'Cancelled').length;
        return { name: p.name, count: activeCount };
      });
  };

  const staffWorkload = getStaffDistribution();



  return (
    <div style={{ position: 'relative' }}>
      
      {/* GLOWING AMBIENT BACKGROUND BUBBLES */}
      <style>{`
        .g-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          z-index: 0;
          pointer-events: none;
          opacity: 0.16;
        }
        .g-orb-1 {
          top: 50px;
          right: 50px;
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #06B6D4, #3B82F6);
        }
        .g-orb-2 {
          bottom: 100px;
          left: 100px;
          width: 250px;
          height: 250px;
          background: linear-gradient(135deg, #EC4899, #8B5CF6);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }
        .analytics-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }
        .chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 1024px) {
          .analytics-grid, .chart-grid {
            grid-template-columns: 1fr;
          }
        }
        .donut-bar {
          height: 8px;
          border-radius: 4px;
          background: #E2E8F0;
          overflow: hidden;
          margin-top: 8px;
        }
        .donut-fill {
          height: 100%;
          border-radius: 4px;
        }
        .chart-tooltip {
          position: absolute;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 8px 12px;
          color: #ffffff;
          font-size: 0.75rem;
          pointer-events: none;
          z-index: 1000;
          transform: translate(-50%, 15px); /* Position tooltip below the point to avoid clipping */
          transition: all 0.1s ease;
        }
      `}</style>

      {/* FLOATING SPHERES IN BACKSTAGE */}
      <div className="g-orb g-orb-1"></div>
      <div className="g-orb g-orb-2"></div>

      <header className="page-header" style={{ position: 'relative', zIndex: 1 }}>
        <div className="page-title-group">
          <h1>Overview Dashboard</h1>
          <p>Monitor customer requests, assignments, and payments.</p>
        </div>
      </header>

      {/* METRIC BOXES */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: 8 }}>
        <MetricCards metrics={metrics} />
      </div>




      {/* TOP CHARTS SECTION */}
      <div className="chart-grid">
        <TrendChart 
          title="Revenue Audit" 
          dataDays={revDays} 
          dataValues={revValues} 
          chartTimeframe={revenueTimeframe} 
          setChartTimeframe={setRevenueTimeframe}
          gradientColors={['#8B5CF6', '#0EA5E9']}
          strokeColors={['#8B5CF6', '#3B82F6', '#0EA5E9']}
          formatValue={v => `₹${v.toFixed(2)}`}
          icon={TrendingUp}
        />
        <BarChart 
          title="Orders Volume" 
          dataDays={ordDays} 
          dataValues={ordValues} 
          chartTimeframe={ordersTimeframe} 
          setChartTimeframe={setOrdersTimeframe}
          gradientColors={['#EC4899', '#F59E0B']}
          strokeColors={['#EC4899', '#F43F5E', '#F59E0B']}
          formatValue={v => `${v} orders`}
          icon={Calendar}
        />
      </div>

      {/* BOTTOM METRICS */}
      <div className="analytics-grid">
        {/* CHART 2: CLOTH POPULARITY */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0 }}>
        <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <PieChart size={18} style={{ color: '#F59E0B' }} />
              <span>Garment Popularity</span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              {[
                { name: 'Shirt', count: garmentCounts.Shirt, color: '#3B82F6' },
                { name: 'Pant', count: garmentCounts.Pant, color: '#10B981' },
                { name: 'Saree', count: garmentCounts.Saree, color: '#F59E0B' },
                { name: 'T-Shirt', count: garmentCounts['T-Shirt'], color: '#EC4899' },
                { name: 'Coat', count: garmentCounts.Coat, color: '#8B5CF6' }
              ].map(item => {
                const pct = ((item.count / totalGarments) * 100).toFixed(0);
                return (
                  <div key={item.name} style={{ fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-dark)' }}>{item.name} ({item.count} items)</span>
                      <span style={{ color: item.color }}>{pct}%</span>
                    </div>
                    <div className="donut-bar">
                      <div className="donut-fill" style={{ width: `${pct}%`, backgroundColor: item.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      {/* STAFF WORKLOAD METER CARD */}
      <div className="glass-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Users size={18} style={{ color: '#8B5CF6' }} />
          <span>Active Staff Workload Distribution</span>
        </h3>
        
        {staffWorkload.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            No active partners online.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {staffWorkload.map(p => (
              <div 
                key={p.name} 
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.4)', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  borderRadius: 12, 
                  padding: 16 
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: 4 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Queue: <strong style={{ color: 'var(--primary-dark)' }}>{p.count} active tasks</strong>
                </div>
                {/* Visual Load Progress Bar */}
                <div style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(226,232,240,0.8)', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      borderRadius: 3, 
                      backgroundColor: p.count > 5 ? '#EF4444' : p.count > 2 ? '#F59E0B' : '#10B981',
                      width: `${Math.min((p.count / 8) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* RECENT ORDERS GLASS TABLE */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.25)' }}>
          <h2 className="card-title" style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Bookings</h2>
        </div>
        
        <div className="custom-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: 44, paddingLeft: 20 }}>#</th>
                <th style={{ minWidth: 148 }}>Booking ID</th>
                <th style={{ minWidth: 190 }}>Customer</th>
                <th style={{ minWidth: 148 }}>Phone</th>
                <th style={{ minWidth: 100 }}>Landmark</th>
                <th style={{ minWidth: 138 }}>Status</th>
                <th style={{ minWidth: 86 }}>Payment</th>
                <th style={{ minWidth: 90, textAlign: 'right' }}>Amount</th>
                <th style={{ minWidth: 70, paddingRight: 20, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentBookings.map((o, idx) => (
                <tr key={o.id}>
                  <td style={{ paddingLeft: 20, color: '#94a3b8', fontWeight: 600, fontSize: '0.8rem' }}>{indexOfFirstBooking + idx + 1}</td>
                  <td>
                    <span style={{
                      fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#0284c7',
                      whiteSpace: 'nowrap'
                    }}>
                      {fmtBookingId(o.id)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {getAvatar(o.customerNameSnapshot || 'U')}
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.875rem', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                          {o.customerNameSnapshot || 'Unknown'}
                        </div>
                        {o.customerPhone && (
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', marginTop: 2, letterSpacing: '0.4px' }}>
                            {fmtCustId(o.customerPhone)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#475569', fontWeight: 600, fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                    {formatPhone(o.customerPhone || o.customer?.phone)}
                  </td>
                  <td style={{ maxWidth: 110, overflow: 'hidden' }}>
                    <SmartTooltip
                      text={o.pickupLandmark || ''}
                      style={{ maxWidth: 100, fontSize: '0.78rem', color: '#B45309', fontWeight: 600 }}
                      icon={o.pickupLandmark ? <MapPin size={11} color="#B45309" /> : null}
                    />
                  </td>
                  <td>
                    <span className={`badge badge-${getStatusClass(o.status)}`} style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                      {getStatusLabel(o.status)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${o.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-pending'}`} style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem', textAlign: 'right' }}>
                    {o.totalAmount ? `₹${o.totalAmount.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ paddingRight: 20, textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600, minHeight: 'auto' }}
                      onClick={() => setSelectedOrder(o)}
                      title="View Order"
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalBookingsPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.25)',
            background: 'rgba(255,255,255,0.25)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing {indexOfFirstBooking + 1} to {Math.min(indexOfLastBooking, totalBookings)} of {totalBookings} entries
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setRecentBookingsPage(prev => Math.max(prev - 1, 1))}
                disabled={recentBookingsPage === 1}
                style={{
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  background: recentBookingsPage === 1 ? 'transparent' : '#FFF',
                  color: recentBookingsPage === 1 ? 'var(--text-muted)' : 'var(--text-dark)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: recentBookingsPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  opacity: recentBookingsPage === 1 ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              
              {getPageNumbers(recentBookingsPage, totalBookingsPages).map((pageNum, index) => {
                if (pageNum === '...') {
                  return (
                    <span key={`dots-${index}`} style={{ padding: '6px 10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setRecentBookingsPage(pageNum)}
                    style={{
                      border: '1px solid',
                      borderColor: recentBookingsPage === pageNum ? 'var(--primary-dark)' : 'rgba(226, 232, 240, 0.8)',
                      background: recentBookingsPage === pageNum ? 'var(--primary-dark)' : '#FFF',
                      color: recentBookingsPage === pageNum ? '#FFF' : 'var(--text-dark)',
                      padding: '6px 10px',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      minWidth: 32,
                      transition: 'all 0.2s'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setRecentBookingsPage(prev => Math.min(prev + 1, totalBookingsPages))}
                disabled={recentBookingsPage === totalBookingsPages}
                style={{
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  background: recentBookingsPage === totalBookingsPages ? 'transparent' : '#FFF',
                  color: recentBookingsPage === totalBookingsPages ? 'var(--text-muted)' : 'var(--text-dark)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: recentBookingsPage === totalBookingsPages ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  opacity: recentBookingsPage === totalBookingsPages ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
