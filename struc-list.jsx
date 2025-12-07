function StrucName(props) {
  const attr_active = 'bg-blue-900 text-white visited:text-white';
  const attr_normal = 'text-gray-800 hover:bg-gray-200 hover:text-black';
  const attr = (props.selected == props.text) ? attr_active : attr_normal;
  return <a
           key={props.text}
           onClick={props.onHandleClick}
           className={attr} >
           {props.text}
         </a>;
}

function StrucList() {
  const [selected, setSelected] = React.useState("");
  const items = window.gLibrary.structureNames();

  function handleClick(e) {
    // console.log('structure name clicked!', e);
    setSelected(e.target.innerText);
  }

  return (
     items.map((each) => (
       <StrucName text={each} onHandleClick={handleClick} selected={selected} />
    ))
  );
}

const domNode = document.getElementById('struc-list');
const root = ReactDOM.createRoot(domNode);
root.render(<StrucList />);
