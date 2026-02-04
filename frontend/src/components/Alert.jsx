import './Alert.css';

export default function Alert({ type = 'info', message }) {
  return (
    <div className={`alert ${type}`} role="alert">
      <span>{message}</span>
    </div>
  );
}
