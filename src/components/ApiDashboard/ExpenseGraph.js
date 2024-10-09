import React, { useEffect, useState, Suspense } from 'react';

const LazyChartJS = React.lazy(async () => {
  const { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } = await import('chart.js');
  Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
  const { Bar } = await import('react-chartjs-2');
  return { default: Bar };
});

const ExpenseGraph = ({ expenseList, setAllCost, currentDate }) => {
  const [chartData, setChartData] = useState({});
  const allmonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Spt", "Oct", "Nov", "Dec"];

  useEffect(() => {
    try {
      if (expenseList.length > 0) {
        const date = currentDate.year + '-' + currentDate.month;
        let currentList = expenseList.filter(list => list.date.substring(0, 7) === date);
        let num = 0;
        if (currentList.length > 0) {
          const data = currentList.reduce((acc, curr) => {
            const expenseDate = new Date(curr.date);
            const date = expenseDate.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
            });

            if (!acc[date]) {
              acc[date] = 0;
            }
            acc[date] += (curr.amount / 10);
            num += (curr.amount / 10);

            return acc;
          }, {});
          setAllCost(num);
          const labels = Object.keys(data);
          const amounts = Object.values(data);
          setChartData({
            labels,
            datasets: [
              {
                label: 'Expenses',
                data: amounts,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          });
        } else {
          const labels = [String(allmonth[Number(currentDate.month) - 1])];
          setChartData({
            labels,
            datasets: [
              {
                label: 'Expenses',
                data: [0],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          });
          setAllCost('0');
        }
      } else {
        const labels = [String(allmonth[Number(currentDate.month) - 1])];
        setChartData({
          labels,
          datasets: [
            {
              label: 'Expenses',
              data: [0],
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error processing expense data:', error);
    }
  }, [expenseList, currentDate]);

  if (!chartData.labels) {
    return <div className='text-[20px] sm:text-[22px] md:text-[24px] lg:text-[26px] font-bold' style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: "center", alignItems: "center" }}>Loading Usage Data...</div>;
  }

  return (
      <div className='w-full h-full px-[5px] sm:px-[15px] lg:px-[25px] py-[5px] '>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Suspense fallback={<div>Loading Chart...</div>}>
            <LazyChartJS
                data={chartData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function (value) {
                          return value + " Credits";
                        },
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
            />
          </Suspense>
        </div>
      </div>
  );
};

export default ExpenseGraph;
