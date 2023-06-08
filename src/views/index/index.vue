<template>
  <div class="blocks">
    <div id="pureFullPage">
      <div class="page">
        <div class="text text1">
          <p>Welcome to My Personal Portfolio</p>
          <br />
          <p>
            I am a Full Stack Web Developer with a passion <br />for creating
            beautiful and intuitive Websites and Web Applications.
          </p>
          <br />
          <p>Call me just Stein</p>
        </div>
      </div>
      <div class="page">
        <div class="text text2">
          <p>2017</p>
          <p>Started My Journey</p>
          <br />
          <p>2018</p>
          <p>Worked as a Freelance Developer</p>
          <br />
          <p>2020</p>
          <p>Founded JavaScript Mastery</p>
          <br />
          <p>2021</p>
          <p>Started My Own Platform</p>
        </div>
      </div>
      <div class="page">
        <div class="text text1">
          <p>MERN Memories</p>
          <p>Mongo Express React Node</p>
          <br />
          <p>E-Commerce</p>
          <p>React Javascript</p>
          <br />
          <p>WebRTC App</p>
          <p>React WebRTC</p>
          <br />
          <p>Unichat</p>
          <p>React ChatEngine Firebase</p>
        </div>
      </div>
      <div class="page">
        <div class="text text2">
          <p>Front-End</p>
          <p>Experience with React.js</p>
          <br />
          <p>Back-End</p>
          <p>Experience with Node and Databases</p>
          <br />
          <p>UI/UX</p>
          <p>Experience with tools like Figma</p>
          <br />
        </div>
      </div>
      <div class="page">
        <div class="text text3">
          <p>Contact Me</p>
          <p>Audstein Allen</p>
          <p>crazycoderstein@gmail.com</p>
        </div>
      </div>
    </div>
    <div id="mouse">
      <div id="wheel"></div>
    </div>
    <div id="div_canvas" class="div-canvas"></div>
  </div>
</template>

<script>
import Maps from '../../utils/index'
import PureFullPage from 'pure-full-page'
import Hero from '../../components/Hero/Hero'

export default {
  components: { Hero },
  data() {
    return {
      projectName: '模型粒子变换动画',

      isdn: false,
      htmlDate: '...',
      threeApp: '',
      intervalLoad: '',
      timeoutResize: '',
      metorList: [],
    }
  },
  beforeCreate() {},
  beforeMount() {},
  mounted() {
    this.init()

    // window.onresize = () => {
    //   //调用methods中的事件
    //   _this.pageResize();
    // };
  },
  methods: {
    init() {
      const initMap = new Maps(document.getElementById('div_canvas'))
      // 初始化容器
      initMap.setupScene()

      // 显示第一个动画
      initMap.firstAnimation().then(() => {
        // 显示dom
        document.querySelector('#pureFullPage').style.opacity = '1'
        document.querySelector('#mouse').style.opacity = '1'

        console.log(this.currentPosition, this.viewHeight)

        // 创建全屏滚动容器;
        new PureFullPage({
          definePages() {
            const index = Math.abs(this.currentPosition / this.viewHeight)
            // 切换模型
            initMap.changeModel(index)
          },
        }).init()
      })
    },
  },
}
</script>

<style scoped>
.blocks {
  /* color: black; */
  height: 100%;
  width: 100%;
  position: relative;
}
#pureFullPage,
#mouse {
  opacity: 0;
  transition: opacity 500ms ease-in;
}
#pureFullPage {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 999;
}
#mouse {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  margin: auto;
  width: 40px;
  height: 76px;
  border: 2px solid #a3a3a7;
  border-radius: 19px;
  z-index: 999;
}
#wheel {
  width: 8px;
  height: 16px;
  position: absolute;
  top: 1px;
  left: 16px;
  background-color: #c3c3c3;
  border-radius: 6px;
  animation: mousewheel 3s infinite;
}
@keyframes mousewheel {
  0% {
    opacity: 0;
    transform: translateY(0);
  }

  50% {
    transform: translateY(20px);
    opacity: 1;
  }

  100% {
    transform: translateY(60px);
    opacity: 0;
  }
}
.div-canvas {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
}
.page::after {
  position: absolute;
  content: '';
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  /* background: url("../assets/img/meng.png") no-repeat center center; */
  background-size: 100% 100%;
  pointer-events: none;
  z-index: 22;
}
</style>
