export function bindVkInquiry({text,status,copy,chat}) {
  let manualCopy=false;

  async function copyText(){
    try {
      await navigator.clipboard.writeText(text.value);
      status.textContent='Текст скопирован.';
      return true;
    } catch {
      text.focus();
      text.select();
      status.textContent='Скопируйте выделенный текст вручную.';
      return false;
    }
  }

  copy.addEventListener('click',copyText);
  chat.addEventListener('click',async event=>{
    if(manualCopy||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    if(await copyText()){
      window.location.assign(chat.href);
      return;
    }
    manualCopy=true;
    chat.textContent='Открыть чат ВК';
    status.textContent='Скопируйте выделенный текст вручную, затем откройте чат ВКонтакте.';
  });

  return () => {
    manualCopy=false;
    chat.textContent='Скопировать и открыть чат ВК';
    status.textContent='В чате ВКонтакте вставьте готовый текст и отправьте его.';
  };
}
