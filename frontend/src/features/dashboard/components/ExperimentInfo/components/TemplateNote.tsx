import { useEffect, useState } from 'react';
import { useExperimentStore } from '@/store/experimentStore';
import { useToastNotification } from '@/shared/hooks';
import { templatesApi } from '@/shared/api';
import {
  Group,
  GroupTitle,
  GroupHeader,
  GroupActions
} from '@/shared/components/styles';
import {
  TextEditArea,
  TextShowArea
} from '@/shared/components/forms/TextArea';
import {
  CancelButton,
  SaveButton,
  EditButton
} from '@/shared/components/styles';

/**
 * 템플릿 노트 컴포넌트
 * 사용자가 템플릿에 대한 노트를 편집하고 저장할 수 있는 컴포넌트입니다.
 */
export default function TemplateNote() {
  // 템플릿 관련 상태
  const templateId = useExperimentStore((state) => state.templateId);
  const templateNote = useExperimentStore((state) => state.templateNote);
  const setTemplateNote = useExperimentStore((state) => state.setTemplateNote);
  // 토스트 알림 함수들
  const { showInfo, showError, showWarning } = useToastNotification();

  // 템플릿 노트 편집 상태
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [localNote, setLocalNote] = useState('');

  // 템플릿 아이디가 변경될 때 편집 상태 초기화
  useEffect(() => {
    setIsEditingNote(false);
    setLocalNote('');
  }, [templateId]);

  /**
   * 편집 시작 핸들러
   * 현재 노트 내용을 로컬 상태로 복사하고 편집 모드로 전환
   */
  const handleEditStart = () => {
    setLocalNote(templateNote || '');
    setIsEditingNote(true);
  };

  /**
   * 편집 취소 핸들러
   * 편집 모드를 종료하고 로컬 상태를 초기화
   */
  const handleEditCancel = () => {
    setIsEditingNote(false);
    setLocalNote('');
  };

  /**
   * 노트 저장 핸들러
   * 로컬 노트 내용을 서버에 저장하고 전역 상태를 업데이트
   */
  const handleNoteSave = async () => {
    console.log('TemplateNote - templateId:', templateId);
    console.log('TemplateNote - localNote:', localNote);
    
    if (!templateId) {
      console.warn('TemplateNote - templateId is null or undefined');
      showWarning('템플릿 ID가 없습니다.');
      return;
    }

    try {
      console.log('TemplateNote - calling updateTemplateNote API');
      const response = await templatesApi.updateTemplateNote(templateId, {
        note: localNote.trim()
      });
      console.log('TemplateNote - API response:', response);

      // 성공 시 전역 상태 업데이트
      setTemplateNote(localNote.trim());
      setIsEditingNote(false);
      setLocalNote('');
      showInfo('노트가 저장되었습니다.');
    } catch (error) {
      console.error('노트 저장 에러:', error);
      showError('노트 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <Group>
      <GroupHeader>
        <GroupTitle>실험 노트</GroupTitle>
        {!isEditingNote && (
          <GroupActions>
            <EditButton onClick={handleEditStart}>
              수정
            </EditButton>
          </GroupActions>
        )}
      </GroupHeader>

      {/* 입력 형태 */}
      {isEditingNote && (
        <div>
          <TextEditArea
            value={localNote}
            onChange={(event) => setLocalNote(event.target.value)}
            placeholder="자유롭게 노트를 작성해보세요."
            rows={4}
            style={{ marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <SaveButton onClick={handleNoteSave}>
              저장
            </SaveButton>
            <CancelButton onClick={handleEditCancel}>
              취소
            </CancelButton>
          </div>
        </div>
      )}

      {/* 읽기 형태 */}
      {!isEditingNote && (
        <TextShowArea>
          {templateNote}
        </TextShowArea>
      )}
    </Group>
  );
}