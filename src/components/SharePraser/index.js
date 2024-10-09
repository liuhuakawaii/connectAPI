import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { modalObjAtom, taskDetailAtom, taskInitAtom } from '../../store';
import { getTaskDetail } from '../../utils/net';
import * as Sentry from "@sentry/react";

function SharePraser() {
    const { taskUUid } = useParams();
    const [, setTaskInit] = useRecoilState(taskInitAtom);
    const [, setTaskDetail] = useRecoilState(taskDetailAtom);
    const [modalObj, setModalObj] = useRecoilState(modalObjAtom);
    const location = useLocation();
    const navi = useNavigate();

    const handleClickCard = async (task_uuid) => {
        try {
            if (!task_uuid) {
                console.error('task_uuid is not provided');
                return false;
            }

            const rep = await getTaskDetail(task_uuid);
            setTaskDetail(rep.data);
            setTaskInit(false);
            if (location.pathname.includes('/imageto3d')) {
                setModalObj({
                    ...modalObj,
                    type: 'ImagineFace',
                    taskuuid: task_uuid,
                    state: true
                });
            } else if (location.pathname.includes('/chatavatar') || location.pathname.includes('/result/detail')) {
                setModalObj({
                    ...modalObj,
                    type: 'DreamFace',
                    taskuuid: task_uuid,
                    state: true
                });
            } else {
                setModalObj({
                    ...modalObj,
                    type: 'DreamFace',
                    taskuuid: task_uuid,
                    state: true
                });
            }
        } catch (e) {
            Sentry.captureException(e)
        }
    };

    if (taskUUid) {
        handleClickCard(taskUUid);
        navi(`/chatavatar/${taskUUid}`, {});
    }

    return <div />;
}

export { SharePraser };
