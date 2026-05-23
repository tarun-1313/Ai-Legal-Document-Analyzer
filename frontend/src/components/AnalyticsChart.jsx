import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AnalyticsChart({ data, title, type = 'bar' }) {
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: title,
        data: Object.values(data),
        backgroundColor: type === 'pie'
          ? [
              '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#22C55E', '#D946EF',
            ]
          : 'rgba(37, 99, 235, 0.6)',
        borderColor: type === 'pie' ? 'transparent' : 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: {
          color: '#9ca3af',
          font: { size: 10, weight: 'bold' },
          padding: 20,
          usePointStyle: true
        }
      },
      title: { 
        display: !!title, 
        text: title,
        color: '#fff'
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: true
      }
    },
    scales: type === 'bar' ? {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#6b7280', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 10 } }
      }
    } : {}
  };

  return type === 'pie' ? <Pie data={chartData} options={options} /> : <Bar data={chartData} options={options} />;
}
