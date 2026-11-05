import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, Pencil, Star } from 'lucide-react';
import { AVATARS, loadSave, storeSave, type Avatar } from '@/game/storage';
import { loadLettersSave } from '@/letters/storage';
import { SiteDialog } from './Dialog';
import { storeProfile, type ChildProfile } from './profile';

export function ProfileDialog({ profile, onChange, onClose, onPlay }: {
  profile: ChildProfile | null;
  onChange: (profile: ChildProfile | null) => void;
  onClose: () => void;
  onPlay: () => void;
}) {
  const [editing, setEditing] = useState(!profile);
  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(profile?.age ?? 4);
  const [avatar, setAvatar] = useState<Avatar>(profile?.avatar ?? loadSave().avatar);
  const [error, setError] = useState('');
  const progress = loadSave();
  const totalStars = Object.values(progress.stars).reduce((total, value) => total + value, 0);
  const levelsDone = Object.values(progress.stars).filter(value => value > 0).length;
  const letters = loadLettersSave();
  const lettersStars = Object.values(letters.stars).reduce((total, value) => total + value, 0);
  const lettersDone = Object.values(letters.stars).filter(value => value > 0).length;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) { setError('Подскажите, как зовут ребёнка.'); return; }
    const value: ChildProfile = { name: cleanName, age, avatar };
    if (!storeProfile(value)) {
      setError('Браузер не разрешил сохранить профиль. Играть можно и без него.');
      return;
    }
    storeSave({ ...progress, avatar });
    onChange(value);
    setEditing(false);
    setError('');
  }

  return (
    <SiteDialog title={editing ? (profile ? 'Настроим профиль' : 'Давайте знакомиться!') : `Привет, ${profile?.name}!`} onClose={onClose}>
      {editing ? (
        <>
          <p className="pk-dialog-description">Маленький профиль для больших открытий. Без почты и пароля, только на этом устройстве.</p>
          <form className="pk-profile-form" onSubmit={submit}>
            <fieldset className="pk-avatar-fieldset">
              <legend>Выберите героя</legend>
              <div className="pk-profile-avatars">
                {(['boy', 'girl'] as Avatar[]).map(value => (
                  <button key={value} type="button" className={avatar === value ? 'is-selected' : ''} aria-label={value === 'boy' ? 'Герой: мальчик' : 'Герой: девочка'} aria-pressed={avatar === value} onClick={() => setAvatar(value)}>
                    <img src={AVATARS[value]} alt="" />
                    {avatar === value && <span><Check size={15} strokeWidth={3} /></span>}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="pk-field">Как зовут ребёнка?
              <input value={name} onChange={event => setName(event.target.value)} placeholder="Например, Саша" maxLength={24} required autoComplete="off" />
            </label>
            <label className="pk-field">Сколько ему лет?
              <select value={age} onChange={event => setAge(Number(event.target.value))}>
                {[3, 4, 5, 6, 7].map(value => <option key={value} value={value}>{value} {value < 5 ? 'года' : 'лет'}</option>)}
              </select>
            </label>
            {error && <p className="pk-form-error" role="alert">{error}</p>}
            <button className="pk-button pk-button--full" type="submit">{profile ? 'Сохранить' : 'Создать профиль'}<ArrowRight size={20} /></button>
            <p className="pk-form-note">Профиль и игровые достижения хранятся в вашем браузере. Регистрация для игры не нужна.</p>
          </form>
        </>
      ) : (
        <div className="pk-profile-overview">
          <img className="pk-profile-photo" src={AVATARS[profile?.avatar ?? 'boy']} alt="Выбранный герой" />
          <p>Сегодня отличный день, чтобы узнать что-то новое.</p>
          <div className="pk-profile-progress">
            <div><strong>Математика с Белочкой</strong><Star size={20} fill="#FFD265" stroke="#D99618" /></div>
            <progress value={totalStars} max={24} aria-label="Прогресс по математике" />
            <p>{totalStars} из 24 звёзд <span>{levelsDone} из 8 уровней</span></p>
          </div>
          <div className="pk-profile-progress" style={{ marginTop: 14 }}>
            <div><strong>Знакомство с буквами</strong><Star size={20} fill="#FFD265" stroke="#D99618" /></div>
            <progress value={lettersStars} max={18} aria-label="Прогресс по буквам" />
            <p>{lettersStars} из 18 звёзд <span>{lettersDone} из 6 уровней</span></p>
          </div>
          <button type="button" className="pk-button pk-button--full" onClick={onPlay}>{totalStars ? 'Продолжить играть' : 'Начать играть'}<ArrowRight size={20} /></button>
          <button type="button" className="pk-text-button" onClick={() => setEditing(true)}><Pencil size={16} />Изменить профиль</button>
          <button type="button" className="pk-profile-signout" onClick={() => {
            if (storeProfile(null)) { onChange(null); onClose(); }
            else setError('Не удалось изменить данные браузера. Попробуйте ещё раз.');
          }}>Выйти из профиля</button>
          {error && <p className="pk-form-error" role="alert">{error}</p>}
          <p className="pk-form-note">При выходе звёзды и пройденные уровни останутся на этом устройстве.</p>
        </div>
      )}
    </SiteDialog>
  );
}