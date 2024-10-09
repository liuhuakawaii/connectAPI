import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { AiFillHeart } from 'react-icons/ai';
import { cardsAtom, cardsTypeAtom, logInfoAtom, showLoginAtom, } from '../../../../store';
import { likeCard } from '../../../../utils/net';
import React, { useContext } from 'react';
import { CardDataContext } from '../../../../utils/context';
import * as Sentry from "@sentry/react";

const Like = React.forwardRef((props, ref) => {
  const logInfo = useRecoilValue(logInfoAtom);
  const setShowLogin = useSetRecoilState(showLoginAtom);
  const cardsType = useRecoilValue(cardsTypeAtom);
  const [cards, setCards] = useRecoilState(cardsAtom);
  const { task_uuid, user_state, num_like, is_like } = useContext(CardDataContext);

  const handleLikeClick = async (task_uuid) => {
    if (!logInfo) {
      setShowLogin(true);
      return;
    }
    try {
      const newCards = JSON.parse(JSON.stringify(cards));
      const index = cards.findIndex((item) => item.task_uuid === task_uuid);
      if (index === -1) return;
      newCards[index].is_like = !is_like;
      newCards[index].num_like = is_like ? num_like - 1 : num_like + 1;
      setCards(newCards);
      likeCard({ task_uuid, operation: is_like ? 'Delike' : 'Like' })
    } catch (e) {
      Sentry.captureException(e)
      console.error(e);
    }
  };

  return (<div
    ref={ref}
    className={`w-[40px] h-[40px] rounded-xl bg-[rgba(255,255,255,0.15)] transition-300-ease backdrop-blur-sm flex-center ${is_like ? "bg-[rgba(250,45,83,0.15)]" : 'hover:bg-[rgba(255,255,255,0.25)]'}`}
    onClick={handleLikeClick.bind(null, task_uuid)}
    style={
      (user_state === 'Generating' && ['Mine', 'Group'].includes(cardsType)) ? { display: 'none' } : {}
    }
  >
    <AiFillHeart style={{ transition: "color 0.3s ease", color: is_like ? '#fa2d53' : 'rgb(255,255,255)', fontSize: '20px' }} />
  </div>)
})

Like.displayName = 'Like'
export default Like