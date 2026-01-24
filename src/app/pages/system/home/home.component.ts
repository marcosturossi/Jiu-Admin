import {Component, OnDestroy, OnInit} from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {SubnavComponent} from "../../../shared/subnav/subnav.component";
import {SubnavService} from "../../../services/subnav.service";
import {Subscription} from "rxjs";
import {NgxEchartsModule, provideEchartsCore} from 'ngx-echarts';
import {EChartsOption} from 'echarts';
import * as echarts from 'echarts';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    imports: [SubnavComponent, NgxEchartsModule],
    providers: [provideEchartsCore({ echarts })],
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  // Bar Chart Options
  barChartOptions: EChartsOption = {
    title: {
      text: 'Monthly Student Registrations',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Students',
        type: 'bar',
        data: [12, 18, 15, 22, 25, 20, 28, 30, 26, 32, 35, 40],
        itemStyle: {
          color: '#5470c6'
        }
      }
    ]
  };

  // Pie Chart Options
  pieChartOptions: EChartsOption = {
    title: {
      text: 'Belt Distribution',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: 'Belt',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 45, name: 'White Belt' },
          { value: 30, name: 'Blue Belt' },
          { value: 18, name: 'Purple Belt' },
          { value: 12, name: 'Brown Belt' },
          { value: 5, name: 'Black Belt' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  // Line Chart Options
  lineChartOptions: EChartsOption = {
    title: {
      text: 'Class Attendance',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Morning', 'Afternoon', 'Evening'],
      top: 30
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Morning',
        type: 'line',
        data: [15, 18, 16, 20, 22, 25, 20],
        smooth: true
      },
      {
        name: 'Afternoon',
        type: 'line',
        data: [10, 12, 14, 15, 16, 18, 15],
        smooth: true
      },
      {
        name: 'Evening',
        type: 'line',
        data: [25, 30, 28, 32, 35, 40, 30],
        smooth: true
      }
    ]
  };

  // Gauge Chart Options
  gaugeChartOptions: EChartsOption = {
    title: {
      text: 'Class Capacity',
      left: 'center'
    },
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 8,
        axisLine: {
          lineStyle: {
            width: 6,
            color: [
              [0.25, '#FF6E76'],
              [0.5, '#FDDD60'],
              [0.75, '#58D9F9'],
              [1, '#7CFFB2']
            ]
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 20,
          offsetCenter: [0, '-60%'],
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2
          }
        },
        splitLine: {
          length: 20,
          lineStyle: {
            color: 'auto',
            width: 5
          }
        },
        axisLabel: {
          color: '#464646',
          fontSize: 12,
          distance: -60,
          formatter: function (value) {
            return value + '%';
          }
        },
        title: {
          offsetCenter: [0, '-20%'],
          fontSize: 16
        },
        detail: {
          fontSize: 30,
          offsetCenter: [0, '0%'],
          valueAnimation: true,
          formatter: function (value) {
            return Math.round(value) + '%';
          },
          color: 'auto'
        },
        data: [
          {
            value: 78,
            name: 'Occupied'
          }
        ]
      }
    ]
  };

  constructor(private subnavService: SubnavService) {
  }

  ngOnInit(): void {
    this.subnavService.setTitle("Home");
  }

}
