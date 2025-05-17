import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="middle">
        <div className="bar bar1" />
        <div className="bar bar2" />
        <div className="bar bar3" />
        <div className="bar bar4" />
        <div className="bar bar5" />
        <div className="bar bar6" />
        <div className="bar bar7" />
        <div className="bar bar8" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .middle {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    position: absolute;
  }

  .bar {
    width: 10px;
    height: 70px;
    display: inline-block;
    transform-origin: bottom center;
    border-top-right-radius: 20px;
    border-top-left-radius: 20px;
    box-shadow: 5px 10px 20px inset rgba(255, 255, 0, 0.8); /* Yellow box shadow */
    animation: loader 1.2s linear infinite;
  }

  .bar1 {
    animation-delay: 0.1s;
  }

  .bar2 {
    animation-delay: 0.2s;
  }

  .bar3 {
    animation-delay: 0.3s;
  }

  .bar4 {
    animation-delay: 0.4s;
  }

  .bar5 {
    animation-delay: 0.5s;
  }

  .bar6 {
    animation-delay: 0.6s;
  }

  .bar7 {
    animation-delay: 0.7s;
  }

  .bar8 {
    animation-delay: 0.8s;
  }

  @keyframes loader {
    0% {
      transform: scaleY(0.1);
      background: transparent;
      /* Change background to transparent */
    }

    50% {
      transform: scaleY(1);
      background: linear-gradient(
        to bottom,
        #ffd700,
        #ffff00
      ); /* Gradient from gold to yellow */
    }

    100% {
      transform: scaleY(0.1);
      background: transparent;
    }
  }`;

export default Loader;
