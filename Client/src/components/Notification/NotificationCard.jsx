import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FiAlertTriangle, FiBell, FiCheck, FiInfo, FiTrash2 } from 'react-icons/fi';

dayjs.extend(relativeTime);

const typeConfig = {
	alert: { label: 'Alert', color: '#dc2626', background: '#fef2f2', icon: FiAlertTriangle },
	safety: { label: 'Safety', color: '#059669', background: '#ecfdf5', icon: FiCheck },
	delay: { label: 'Delay', color: '#d97706', background: '#fffbeb', icon: FiBell },
	system: { label: 'System', color: '#2563eb', background: '#eff6ff', icon: FiInfo },
	general: { label: 'Update', color: '#475569', background: '#f8fafc', icon: FiInfo }
};

export default function NotificationCard({ notification, onMarkRead, onDelete }) {
	const config = typeConfig[notification.type] || typeConfig.general;
	const Icon = config.icon;
	const createdAt = notification.createdAt ? dayjs(notification.createdAt).fromNow() : 'just now';

	return (
		<article style={{ display: 'flex', gap: '14px', padding: '16px', borderRadius: '18px', background: notification.read ? '#ffffff' : '#eff6ff', border: '1px solid', borderColor: notification.read ? '#e2e8f0' : '#bfdbfe', boxShadow: notification.read ? 'none' : '0 12px 30px rgba(37, 99, 235, 0.08)' }}>
			<div style={{ width: '42px', height: '42px', borderRadius: '14px', display: 'grid', placeItems: 'center', lineHeight: 0, flexShrink: 0, background: config.background, color: config.color }}>
				<Icon size={18} style={{ display: 'block' }} />
			</div>

			<div style={{ flex: 1, minWidth: 0 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
					<div>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
							<h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{notification.title}</h3>
							{!notification.read && <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#2563eb', display: 'inline-block' }} />}
						</div>
						<span style={{ fontSize: '11px', fontWeight: 700, color: config.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{config.label}</span>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
						{!notification.read && (
							<button type="button" onClick={() => onMarkRead(notification._id)} style={{ border: 'none', background: '#dbeafe', color: '#1d4ed8', padding: '8px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
								Mark read
							</button>
						)}
						<button type="button" onClick={() => onDelete(notification._id)} style={{ border: 'none', background: '#f8fafc', color: '#475569', width: '34px', height: '34px', borderRadius: '999px', cursor: 'pointer', display: 'grid', placeItems: 'center' }} aria-label="Delete notification">
							<FiTrash2 size={14} />
						</button>
					</div>
				</div>

				<p style={{ margin: '10px 0 8px', color: '#334155', fontSize: '14px', lineHeight: 1.6 }}>{notification.message}</p>

				<div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
					<span style={{ fontSize: '12px', color: '#64748b' }}>{createdAt}</span>
					{notification.data?.tripId && <span style={{ fontSize: '12px', color: '#475569' }}>Trip: {notification.data.tripId}</span>}
				</div>
			</div>
		</article>
	);
}

