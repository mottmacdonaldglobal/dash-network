import React, {Component} from 'react';
import PropTypes from 'prop-types';
import NetworkD3 from '../d3/network';

/**
 * Network graph component, based on D3 force layout
 */
export default class Network extends Component {
    componentDidMount() {
        this.network = new NetworkD3(this.el, this.props, node => {
           const {setProps} = this.props;
           const selectedId = node && node.id;

           if (setProps) { setProps({selectedId}); }
           else { this.setState({selectedId}); }
       });
    }

    componentDidUpdate() {
        this.network.update(this.props);
    }

    render() {
        return <div id={this.props.id} ref={el => {this.el = el}} />;
    }
}

Network.defaultProps = {
    width: 1000,
    height: 300,
    padding: 4,
    groupPadding: 20,
    margin: 10,
    groupMargin: 20
};

Network.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string,

    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change
     */
    setProps: PropTypes.func,

    /**
     * Width of the figure to draw, in pixels
     */
    width: PropTypes.number,

    /**
     * Height of the figure to draw, in pixels
     */
    height: PropTypes.number,

    /**
     * The network data. Should have the form:
     *
     *   `{nodes: [node0, node1, ...], links: [link0, link1, ...]}`
     *
     * nodes have the form:
     *
     *   `{id: 'node id'[, radius: number][, color: 'css color string']}`
     *
     * `id` is required, must be unique, and is used both in links and
     * as the node text.
     * `radius` is an optional relative radius, scaled by `maxRadius`
     * `color` is an optional css color string.
     *
     * links have the form:
     *
     *   `{source: sourceId, target: targetId[, width: number]}`
     *
     * `source` and `target` are required, and must match node ids.
     * `width` is an optional relative width, scaled by `maxLinkWidth`
     */
    data: PropTypes.object.isRequired,

    /**
     * Optional version id for data, to avoid having to diff a large object
     */
    dataVersion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    /**
     * Optional default width of links, in px
     */
    padding: PropTypes.number,

    /**
     * Optional maximum width of links, in px. If individual links have `width`,
     * these will be scaled linearly so the largest one has width `maxLinkWidth`.
     */
    groupPadding: PropTypes.number,

    /**
     * Optional default radius of nodes, in px
     */
    margin: PropTypes.number,

    /**
    * Optional maximum radius of nodes, in px. If individual nodes have `radius`,
    * these will be scaled linearly so the largest one has radius `maxRadius`.
     */
    groupMargin: PropTypes.number,

    /**
     * The currently selected node id
     */
    selectedId: PropTypes.string
};
