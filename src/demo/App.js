/* eslint no-magic-numbers: 0 */
import React, {Component} from 'react';

import {OrthoNetwork} from '../lib';

const IDLIST = [
    'pickle',
    'tortilla',
    'mustard',
    'lettuce',
    'tomato',
    'pineapple',
    'ice cream',
    'banana',
    'salami',
    'smoked salmon'
];

export default class App extends Component {

    constructor() {
        super();
        this.state = {
            data: {
                nodes: [
                    {id: 'mayo'},
                    {id: 'blue cheese'},
                    {id: 'bread'},
                    {id: 'peanut butter'},
                    {id: 'jelly'}
                ],
                links: [
                    {source: 'mayo', target: 'blue cheese'},
                    {source: 'mayo', target: 'bread'},
                    {source: 'blue cheese', target: 'bread'},
                    {source: 'blue cheese', target: 'jelly'},
                    {source: 'bread', target: 'peanut butter'},
                    {source: 'bread', target: 'jelly'},
                    {source: 'peanut butter', target: 'jelly'}
                ]
            },
            dataVersion: 1
        };
        this.setProps = this.setProps.bind(this);
     //   this.mutateData = this.mutateData.bind(this);

    //    this.period = 3;
    //    this.updateInterval = setInterval(this.mutateData, 1000 * this.period);
    }

    setProps(newProps) {
        this.setState(newProps);
    }

    render() {
        const {selectedId, data} = this.state;

        const selectionInfo = () => {
            if(!selectedId) { return 'No selection'; }

            let out = 'Selected: ' + selectedId + '\nGoes well with:';

            data.links.forEach(link => {
                const goesWith =
                    link.target === selectedId ? link.source :
                    link.source === selectedId ? link.target :
                    '';

                if(goesWith) { out += '\n-> ' + goesWith; }
            });

            return out;
        };

        return (
            <div>
                <h2>Network Graph Demo</h2>
                <p>Click a node to show its links</p>
                <OrthoNetwork
                    setProps={this.setProps}
                    {...this.state}
                />
                <div style={{whiteSpace: 'pre-line'}}>{selectionInfo()}</div>
            </div>
        )
    }

    mutateData() {
        const {data, dataVersion} = this.state;

        function pickOne(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        }

        function addNode() {
            const id = pickOne(IDLIST) + ' ' + dataVersion;
            const newLinks = Math.floor(Math.random() * 5) + 1;
            const idsTaken = {};
            for(let i = 0; i < newLinks; i++) {
                const target = pickOne(data.nodes).id;
                if(!idsTaken[target]) {
                    idsTaken[target] = 1;
                    data.links.push({target, source: id});
                }
            }
            data.nodes.push({id, radius: Math.random() + 1});
        }

        function deleteNode() {
            const id = pickOne(data.nodes).id;
            data.nodes = data.nodes.filter(n => n.id !== id);
            data.links = data.links.filter(l => l.source !== id && l.target !== id);
        }

        const ops = [addNode];
        if(data.nodes.length < 30) { ops.push(addNode); }
        if(data.nodes.length > 5) { ops.push(deleteNode); }

        pickOne(ops)();

        this.setState({data, dataVersion: dataVersion + 1});
    }
}
