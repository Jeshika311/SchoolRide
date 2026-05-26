import NotificationCard from './NotificationCard';

export default function NotificationList({ notifications, onMarkRead, onDelete }) {
	if (!notifications.length) {
		return (
			<div style={{ padding: '40px 24px', textAlign: 'center', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
				<p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>No notifications yet.</p>
			</div>
		);
	}

	return (
		<div style={{ display: 'grid', gap: '14px' }}>
			{notifications.map((notification) => (
				<NotificationCard
					key={notification._id}
					notification={notification}
					onMarkRead={onMarkRead}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}

