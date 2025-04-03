import { useState } from 'react'
import './App.css'
import React from 'react'

/*const toppings=[
    'Pearl', 'Red Bean', 'Herb Jelly', 'Aiyu Jelly', 'Lychee Jelly', 'Mini Pearl', 'Ice Cream Pudding', 'Aloe Vero', 'Crystal Boba'
]*/

type Item={
    name: string;
    group: string;
    cost: number;
    id: number;
}

/*type Cust_Item = Item&{
    icePer: number;
    sugarPer: number;
    topping: string;
    numberOf: number;
    totalCost: number;
}*/

function App() {
    const [cart_Items, set_Cart_Items] = useState<Item[]>([]);

    
        const [menu_Items, set_Menu] = useState("");
      
        React.useEffect(()=>{
          fetch("http://localhost:3000/" + "manager/menu")
          .then((res) => res.json())
          .then((data) => set_Menu(data))
          .catch(e => console.log(e))
        }, []);
      
        var menu_Data = JSON.parse(JSON.stringify(menu_Items));
        const menu: Item[] = [];
        for(var i in menu_Data){
            menu.push({id: menu_Data[i].id, name: menu_Data[i].item_name, cost: menu_Data[i].base_cost, group: menu_Data[i].item_group});
        }
          
        


    /*const menu: Item[]=[
        { name: 'Classic Milk Tea', group: 'Milk Tea', cost: 4.5, id: 0},
        { name: 'Honey Milk Tea', group: 'Milk Tea', cost: 4.75, id: 1},
        { name: 'Classic Coffee', group: 'Milk Tea', cost: 4.85, id: 2},
        { name: 'Coffee Milk Tea', group: 'Milk Tea', cost: 5, id: 3},
        { name: 'Classic tea', group: 'Brewed Tea', cost: 4.25, id: 4},
        { name: 'Wintermelon Tea', group: 'Brewed Tea', cost: 4.5, id: 5},
        { name: 'Honey Tea', group: 'Brewed Tea', cost:4.5, id: 6},
        { name: 'Ginger Tea', group: 'Brewed Tea', cost: 4.5, id: 7},
        { name: 'Mango Green Tea', group: 'Fruit Tea', cost: 4.95, id: 8},
        { name: 'Wintermelon Lemonade', group: 'Fruit Tea', cost: 4.95, id: 9},
        { name: 'Strawberry Tea', group: 'Fruit Tea', cost: 4.95, id: 10},
        { name: 'Peach Tea with Aiyu Jelly', group: 'Fruit Tea', cost: 5.25, id: 11},
        { name: 'Fresh Milk Tea', group: 'Fresh Milk', cost: 5, id: 12},
        { name: 'Wintermelon with Fresh Milk', group: 'Fresh Milk', cost: 5.25, id: 13},
        { name: 'Cocoa Lover with Fresh Milk', group: 'Fresh Milk', cost: 5.25, id: 14},
        { name: 'Fresh Milk Family', group: 'Fresh Milk', cost: 5.25, id: 15},
    ]*/

   const menuCategories: Record<string, Item[]>={};

   menu.forEach(item=>{
    if(menuCategories[item.group]){
        menuCategories[item.group].push(item);
    }
    else {
        menuCategories[item.group] = [];
        menuCategories[item.group].push(item);}
   });

   const add_Item=(item:Item)=>{
        set_Cart_Items(prev_Items=>{
            const new_Item={name: item.name, group: item.group, cost: item.cost, id: item.id};
            return prev_Items.concat(new_Item);
        });
   };

   const remove_Item=(id:number)=>{
    set_Cart_Items(prev_Items=>{
        const new_Item: Item[]=[];
        prev_Items.forEach(item=>{
            if (!(id === item.id))
                new_Item.push(item);
        });
        return new_Item;
    });
   };

    
    let total_Cost = 0;
    cart_Items.forEach(item=>{
        total_Cost += item.cost;
    });

    return(
        <div style = {{
            width: '100%',
            display: 'flex'
            }}>
            {/*Left (80%) side of the page, menu item buttons*/}
            <div style= {{
                width: '80%',
                display: 'flex',
                flexDirection: 'column'
                }}>
                <h1> Menu </h1> 
                
                {
                Object.entries(menuCategories).map(([key_Cat, value_Items])=>(
                    <div key={key_Cat}>
                        <h2> {key_Cat} </h2>
                        <div style = {{
                            display: 'flex'
                            }}>
                            {
                                value_Items.map((item)=>(
                                    <button key={item.id}
                                        onClick={()=> add_Item(item)}
                                        style = {{
                                            height: '150px',
                                            width: '150px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center'
                                        }}
                                    >
                                    
                                        <span style = {{
                                            justifyContent: 'center'
                                            }}>
                                            {item.name}
                                        </span>

                                        <span style = {{
                                            justifyContent: 'center'
                                            }}>
                                            {item.cost}
                                        </span>
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                    ))
                }
            </div>
            {/*Right (20%) side of the page, current order*/}
            <div style = {{
                width: '20%',
                display: 'flex',
                flexDirection: 'column'
                }}>
                
                <h2> Order </h2>

                <div style = {{
                    overflowY:  'auto',
                    }}>

                    {cart_Items.map(item=>(
                        <div key = {item.id}
                            style = {{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                            <div>
                                <div>
                                    {item.name}
                                </div>
                                <div>
                                    {item.cost}
                                </div>
                            </div>
                            <button onClick={()=> remove_Item(item.id)}>
                                x
                            </button>
                        </div>
                        ))
                    }
                </div>

                <div style = {{
                    }}>
                    <div style = {{
                        display: 'flex',
                        }}>
                        <span> Total: </span>
                        <span> ${total_Cost} </span>
                    </div>
                    <button>
                        Checkout
                    </button>
                </div>
            </div>








        </div>
    );
}

export default App;

